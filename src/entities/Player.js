import { playerBaseStats } from '../data/baseStats';
import Entity from './Entity';
import CombatEffects from '../effects/CombatEffects';
import { KNOCKBACK_DURATION_MS, KNOCKBACK_DISTANCE_PX } from '../config/constants';

/** Half-arc angles (radians) for each weapon arc type used in canHit(). */
const ARC_HALF = {
  stab:   Math.PI / 8,         // ~22.5° each side = 45° total
  medium: (Math.PI * 3) / 8,  // ~67.5° each side = 135° total
  wide:   (Math.PI * 5) / 8,  // ~112.5° each side = 225° total
};

// Render order for equipment overlays relative to the base
// body sprite. Lower = rendered first (behind). The body
// sprite itself has no explicit depth — it sits below all
// overlays by creation order.
const OVERLAY_DEPTH = {
  legs:        1,
  feet:        2,
  body_inner:  3,
  body_outer:  4,
  hands:       5,
  shoulder:    6,
  amulet:      7,
  head:        8,
  primary:     9,
  secondary:   10,
};

/**
 * Player — the controllable character sprite.
 *
 * Owns the base body sprite and a set of equipment overlay sprites, one per
 * slot. Overlays are kept in sync with the body every frame so they stay
 * positioned and play the matching directional animation.
 */
export default class Player extends Entity {
  /**
   * @param {Phaser.Scene} scene - The scene this player belongs to.
   * @param {number} x - Initial world X position.
   * @param {number} y - Initial world Y position.
   */
  constructor(scene, x, y) {
    super(scene, playerBaseStats);
    // Create shadow first so it sits behind the player sprite in the display list.
    // Both are at depth 0; shadow is earlier in the list → renders behind sprite.
    this.shadow = scene.add.sprite(x, y, 'Medieval_Shadow_Male_idle1_diag');
    this.shadow.setAlpha(0.4);

    this.sprite = scene.physics.add.sprite(x, y, "player_idle1_diag");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 32);
    this.sprite.body.setOffset(48, 80);
    this.balance = 0; // TODO: wire to economy system — used by Shop.buy()
                     //   but not yet persisted or displayed in HUD

    /**
     * One sprite overlay per equipment slot; null if that slot is empty.
     * Each overlay plays an animation whose key is `{animPrefix}_{baseAnim}`,
     * mirroring the body's current animation direction.
     */
    this.overlays = {
      head: null,
      shoulder: null,
      hands: null,
      body_inner: null,
      body_outer: null,
      legs: null,
      feet: null,
      primary: null,
      secondary: null,
      amulet: null,
    };

    /** World-space target the player is walking toward; null when idle. */
    this.moveTarget = null;
    this.recomputeStats(new Map());
    this.hasWeapon = false;
    this.weaponType = null; // null | 'melee' | 'ranged' | 'magic'
    /** True while an attack animation is playing — blocks movement and re-triggering. */
    this.attackInProgress = false;
    this.invincible = false;

    // When an attack animation finishes, clear the flag and return to idle.
    // _syncOverlays is called immediately so overlays switch in the same tick as the body.
    this.sprite.on("animationcomplete", () => {
      // 1. Clear attack state and re-sync equipment overlays
      this.attackInProgress = false;
      this._syncOverlays();
      // 2. Resume movement toward queued moveTarget if one exists
      if (this.moveTarget) {
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y,
          this.moveTarget.x, this.moveTarget.y,
        );
        this.sprite.play(this.getDirectionAnim(angle));
      } else {
        this.sprite.play(this.getIdleAnim());
      }
      // 3. Apply hit detection and damage to enemies in range
      for (const enemy of this.scene.enemies.getLiving()) {
        if (!this.canHit(enemy.rect)) continue;
        enemy.takeDamage(this.derivedStats.physicalDamage, 'physical', this.sprite.x);
        const hitX = (this.sprite.x + enemy.rect.x) / 2;
        const hitY = (this.sprite.y + enemy.rect.y) / 2;
        CombatEffects.showImpactFlash(this.scene, hitX, hitY);
        CombatEffects.showParticleBurst(this.scene, hitX, hitY);
        this.scene.cameras.main.shake(150, 0.004);
        this.scene.physics.pause();
        this.scene.anims.pauseAll();
        this.scene.time.delayedCall(80, () => {
          this.scene.physics.resume();
          this.scene.anims.resumeAll();
        });
      }
    });
  }

  // ── Combat ──

  takeDamage(amount, type, attackerX) {
    if (this.invincible) return 0;
    const effective = super.takeDamage(amount, type);
    this._applyHitReaction(this.sprite, attackerX);
    this.invincible = true;
    this.scene.time.delayedCall(500, () => { this.invincible = false; });
    return effective;
  }

  _applyHitReaction(anchor, attackerX) {
    // Flash all active overlays to match the base-sprite tint.
    // Base-sprite tint and knockback are both delegated to super.
    const overlaySprites = Object.values(this.overlays).filter(Boolean);
    for (const s of overlaySprites) {
      s.setTintFill(0xffffff);
    }
    this.scene.time.delayedCall(80, () => {
      for (const s of overlaySprites) {
        s.clearTint();
      }
    });
    super._applyHitReaction(anchor, attackerX);
  }

  onDeath() {
    console.log('player died');
  }

  // ── Equipment ──

  /**
   * Places an equipment overlay sprite for the given item's slot.
   * If the slot already has an overlay it is destroyed first.
   * The item must have its spritesheets and animations pre-loaded before calling this.
   * @param {{ slot: string, baseName: string }} item
   */
  equip(item) {
    if (this.overlays[item.equipSlot]) {
      this.overlays[item.equipSlot].destroy();
    }

    const textureKey = item.staticOverlay ? item.id + '_overlay' : `${item.baseName}_idle1_diag`;
    const overlay = this.scene.add.sprite(this.sprite.x, this.sprite.y, textureKey);
    overlay.baseName = item.baseName;
    overlay.isStatic = !!item.staticOverlay;
    overlay.setDepth(OVERLAY_DEPTH[item.equipSlot] ?? 0);
    this.overlays[item.equipSlot] = overlay;
  }

  /**
   * Syncs all player overlay sprites to match the given equipped Map.
   * This is the only entry-point for updating visuals from equipment changes;
   * it is called by the EquipmentManager 'equipmentChanged' event listener.
   * @param {Map<string, object|null>} equippedMap - slot → item|null
   */
  syncEquipment(equippedMap) {
    for (const [slot, item] of equippedMap) {
      if (item !== null) {
        this.equip(item);
      } else {
        this.unequip(slot);
      }
    }
    const primary = equippedMap.get('primary');
    this.hasWeapon  = primary != null;
    if (!primary) {
      this.weaponType = null;
    } else if (primary.weaponSubtype === 'staff') {
      this.weaponType = 'magic';
    } else if (primary.rangeType === 'ranged') {
      this.weaponType = 'ranged';
    } else {
      this.weaponType = 'melee';
    }
    this.weaponSubtype = primary?.weaponSubtype ?? null;
  }

  /**
   * Removes the equipment overlay for the given slot, if one exists.
   * Call this after inventory.removeItemFromEquipped() to sync the visual.
   * @param {string} slot - Equipment slot key (e.g. 'weapon', 'head').
   */
  unequip(slot) {
    if (this.overlays[slot]) {
      this.overlays[slot].destroy();
      this.overlays[slot] = null;
    }
  }

  /**
   * Called every frame to keep all overlay sprites locked to the body sprite.
   * Matches each overlay's position, flip, and animation to the body's current state.
   * Animation keys follow the pattern `{baseName}_{bodyAnimKey}` (e.g. "Medieval_Warfare_Male_Weapon_Longsword_walk_sw").
   */
  _syncOverlays() {
    const currentAnim = this.sprite.anims.currentAnim?.key;

    // Sync shadow sprite
    this.shadow.x = this.sprite.x;
    this.shadow.y = this.sprite.y;
    this.shadow.flipX = this.sprite.flipX;
    // Shadow anim keys mirror body anim keys with a 'shadow_'
    // prefix — this contract is established in createAnims().
    // If you add a new body animation, add a matching shadow
    // sheet and anim registration or the shadow will freeze.
    if (currentAnim) {
      const shadowAnim = 'shadow_' + currentAnim;
      if (this.shadow.anims.currentAnim?.key !== shadowAnim && this.scene.anims.exists(shadowAnim)) {
        this.shadow.play(shadowAnim, true);
      }
    }

    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (!overlay) continue;

      overlay.x = this.sprite.x;
      overlay.y = this.sprite.y;
      overlay.flipX = this.sprite.flipX;

      if (!currentAnim || overlay.isStatic) continue;

      const weaponAnim = overlay.baseName + "_" + currentAnim;
      if (overlay.anims.currentAnim?.key !== weaponAnim && this.scene.anims.exists(weaponAnim)) {
        overlay.play(weaponAnim, true);
      }
    }
  }

  // ── Movement ──

  /**
   * Sets the world-space position the player should walk toward.
   * @param {number} x
   * @param {number} y
   */
  moveTo(x, y) {
    this.moveTarget = { x, y };
  }

  getIdleAnim() {
    if (this.weaponType === 'ranged') return 'shootingstance';
    return super.getIdleAnim();
  }

  // ── Combat ──

  /**
   * Triggers an attack animation toward the given X coordinate.
   * Cancels any active movement. Does nothing if already attacking.
   * Uses attack1 when a weapon overlay is equipped, attack2 (unarmed) otherwise.
   * @param {number} pointerX - World X of the click, used to determine facing direction.
   */
  attack(pointerX) {
    if (this.attackInProgress) return;

    this.attackInProgress = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.flipX = pointerX > this.sprite.x;

    const weapon = this.scene.inventory?.equipped?.get('primary');
    // Transient attack state — set at attack start, consumed by
    // canHit() and the animationcomplete handler. Not persistent
    // between attacks.
    this.currentAttackRange = weapon?.attackRange ?? this.derivedStats.attackRange;
    this.currentArcType = weapon?.arcType ?? 'stab';
    this.attackAngle = Math.atan2(
      this.scene.input.activePointer.worldY - this.sprite.y,
      this.scene.input.activePointer.worldX - this.sprite.x
    );

    CombatEffects.showArc(
      this.scene, this.sprite.x, this.sprite.y,
      this.attackAngle, this.currentArcType, this.currentAttackRange
    );
    CombatEffects.showSlashTrail(
      this.scene, this.sprite.x, this.sprite.y,
      this.attackAngle, this.currentArcType, this.currentAttackRange
    );

    switch (this.weaponType) {
      case 'melee':  this.sprite.play('attack1');        break;
      case 'ranged':
        this.sprite.play(this.weaponSubtype === 'bow' ? 'attack1' : 'shooting');
        break;
      case 'magic':  this.sprite.play('magic');          break;
      default:       this.sprite.play('martialartpunch');
    }
  }

  /**
   * Triggers a random critical-hit animation.
   * Cancels movement and blocks re-triggering until the animation completes.
   */
  triggerCritical() {
    if (this.attackInProgress) return;

    this.attackInProgress = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.play(`critical${Phaser.Math.Between(1, 6)}`);
  }

  // ── Game loop ──

  // ── Hit detection ──

  canHit(rect) {
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    const points = [
      { x: rect.x - hw, y: rect.y - hh },
      { x: rect.x + hw, y: rect.y - hh },
      { x: rect.x - hw, y: rect.y + hh },
      { x: rect.x + hw, y: rect.y + hh },
      { x: rect.x,      y: rect.y      },
    ];

    const range = this.currentAttackRange;
    const attackAngle = this.attackAngle ?? 0;
    const half = ARC_HALF[this.currentArcType ?? 'stab'];

    return points.some(({ x, y }) => {
      const dx = x - this.sprite.x;
      const dy = y - this.sprite.y;
      if (dx * dx + dy * dy > range * range) return false;
      let diff = Math.abs(Math.atan2(dy, dx) - attackAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      return diff <= half;
    });
  }

  /**
   * Called every frame. Handles movement toward the current moveTarget and
   * stops when within one step (avoiding oscillation at the target).
   * Overlays are synced first so they track the sprite even when idle.
   */
  update() {
    this._syncOverlays();
    if (!this.moveTarget && this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
    }
    if (this.attackInProgress) return;

    if (!this.moveTarget) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    this.sprite.flipX = false;
    const dir = this.getDirectionAnim(angle);
    if (this.sprite.anims.currentAnim?.key !== dir) {
      this.sprite.play(dir);
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    // * 2 gives ~2 frames of lookahead at 60fps to prevent
    // oscillation around the target point
    if (distance < this.derivedStats.moveSpeed * 2) {
      this.sprite.body.setVelocity(0, 0);
      this.moveTarget = null;
      this.sprite.play(this.getIdleAnim());
    } else {
      const speed = this.derivedStats.moveSpeed * 60;
      this.sprite.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
      // If body was stopped by a collider, cancel the move target
      if (
        this.sprite.body.blocked.left ||
        this.sprite.body.blocked.right ||
        this.sprite.body.blocked.up ||
        this.sprite.body.blocked.down
      ) {
        this.sprite.body.setVelocity(0, 0);
        this.moveTarget = null;
        this.sprite.play(this.getIdleAnim());
      }
    }
  }

}
