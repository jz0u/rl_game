import { playerBaseStats } from '../data/baseStats';
import Entity from './Entity';
import CombatEffects from '../effects/CombatEffects';
import { SPRITE_FRAME_SIZE, KNOCKBACK_DURATION_MS, KNOCKBACK_DISTANCE_PX } from '../config/constants';

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
      // NOTE: dummy/dummy2 are hardcoded scene references —
      //   TODO: replace with scene enemy registry when enemies
      //   are generalized (see CombatSystem extraction)
      const dummy = this.scene.dummy;
      if (dummy && !dummy.isDead() && this.canHit(dummy.rect)) {
        dummy.takeDamage(this.derivedStats.physicalDamage, 'physical', this.sprite.x);
        const hitX = (this.sprite.x + dummy.rect.x) / 2;
        const hitY = (this.sprite.y + dummy.rect.y) / 2;
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
      const dummy2 = this.scene.dummy2;
      if (dummy2 && !dummy2.isDead() && this.canHit(dummy2.rect)) {
        dummy2.takeDamage(this.derivedStats.physicalDamage, 'physical', this.sprite.x);
        const hitX2 = (this.sprite.x + dummy2.rect.x) / 2;
        const hitY2 = (this.sprite.y + dummy2.rect.y) / 2;
        CombatEffects.showImpactFlash(this.scene, hitX2, hitY2);
        CombatEffects.showParticleBurst(this.scene, hitX2, hitY2);
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

  // ── Asset loading ──

  // TODO: move to src/scene/loadAssets.js — static asset
  // loading has no dependency on Player instance state
  /**
   * Loads all base player spritesheets. Call this from the scene's preload().
   * Equipment spritesheets are loaded separately when an item is equipped.
   * @param {Phaser.Scene} scene
   */
  static preload(scene) {
    // Legacy placeholder sheets — existing animation keys still reference these.
    const legacySheets = [
      { key: 'player_idle1_diag',   path: 'assets/player/player_idle.png' },
      { key: 'player_walking_diag', path: 'assets/player/player_walk.png' },
      { key: 'player_attack1',      path: 'assets/player/player_attack1.png' },
      { key: 'player_attack2',      path: 'assets/player/player_attack2.png' },
    ];

    // All Medieval_Warfare_Male_1 spritesheets.
    // Key = filename minus .png (exact artist naming convention).
    // Note: for animations with both a regular and _diag variant, _diag is the
    // primary gameplay animation; straight-facing variants are loaded for completeness.
    const BASE = 'assets/player/Medieval_Warfare_Male_1/';
    const newKeys = [
      'Medieval_Warfare_Male_1_collapse',
      'Medieval_Warfare_Male_1_collapse_diag',
      'Medieval_Warfare_Male_1_dead',
      'Medieval_Warfare_Male_1_dead_diag',
      'Medieval_Warfare_Male_1_idle1',
      'Medieval_Warfare_Male_1_idle1_diag',
      'Medieval_Warfare_Male_1_idle2',
      'Medieval_Warfare_Male_1_idle2_diag',
      'Medieval_Warfare_Male_1_kneel',
      'Medieval_Warfare_Male_1_kneel_diag',
      'Medieval_Warfare_Male_1_ko',
      'Medieval_Warfare_Male_1_ko_diag',
      'Medieval_Warfare_Male_1_running',
      'Medieval_Warfare_Male_1_running_diag',
      'Medieval_Warfare_Male_1_sitting1',
      'Medieval_Warfare_Male_1_sitting1_diag',
      'Medieval_Warfare_Male_1_sitting2',
      'Medieval_Warfare_Male_1_sitting2_diag',
      'Medieval_Warfare_Male_1_sleeping',
      'Medieval_Warfare_Male_1_sleeping_diag',
      'Medieval_Warfare_Male_1_walking',
      'Medieval_Warfare_Male_1_walking_diag',
      'Medieval_Warfare_Male_1_MVsv',
      'Medieval_Warfare_Male_1_MVsv_alt_attack1',
      'Medieval_Warfare_Male_1_MVsv_alt_attack2',
      'Medieval_Warfare_Male_1_MVsv_alt_critical1',
      'Medieval_Warfare_Male_1_MVsv_alt_critical2',
      'Medieval_Warfare_Male_1_MVsv_alt_critical3',
      'Medieval_Warfare_Male_1_MVsv_alt_critical4',
      'Medieval_Warfare_Male_1_MVsv_alt_critical5',
      'Medieval_Warfare_Male_1_MVsv_alt_critical6',
      'Medieval_Warfare_Male_1_MVsv_alt_dead1',
      'Medieval_Warfare_Male_1_MVsv_alt_dead2',
      'Medieval_Warfare_Male_1_MVsv_alt_dead3',
      'Medieval_Warfare_Male_1_MVsv_alt_magic',
      'Medieval_Warfare_Male_1_MVsv_alt_martialartcritical',
      'Medieval_Warfare_Male_1_MVsv_alt_martialartpunch',
      'Medieval_Warfare_Male_1_MVsv_alt_martialartstance',
      'Medieval_Warfare_Male_1_MVsv_alt_shooting',
      'Medieval_Warfare_Male_1_MVsv_alt_shootingstance',
      'Medieval_Warfare_Male_1_MVsv_alt_stance1',
      'Medieval_Warfare_Male_1_MVsv_alt_stance2',
      'Medieval_Warfare_Male_1_MVsv_alt_stance3',
      'Medieval_Warfare_Male_1_MVsv_alt_stance4',
      'Medieval_Warfare_Male_1_MVsv_alt_stance5',
      'Medieval_Warfare_Male_1_MVsv_alt_stance6',
      'Medieval_Warfare_Male_1_MVsv_alt_victory1',
      'Medieval_Warfare_Male_1_MVsv_alt_victory2',
      'Medieval_Warfare_Male_1_MVsv_alt_victory3',
      'Medieval_Warfare_Male_1_MVsv_alt_victory4',
      'Medieval_Warfare_Male_1_MVsv_alt_victory5',
      'Medieval_Warfare_Male_1_MVsv_alt_victory6',
      'Medieval_Warfare_Male_1_MVsv_alt_victory7',
      'Medieval_Warfare_Male_1_MVsv_alt_victory8',
    ];

    const SHADOW_BASE = 'assets/player/Medieval_Male_Shadow/';
    const shadowKeys = [
      'Medieval_Shadow_Male_idle1_diag',
      'Medieval_Shadow_Male_idle2_diag',
      'Medieval_Shadow_Male_walking_diag',
      'Medieval_Shadow_Male_running_diag',
      'Medieval_Shadow_Male_collapse_diag',
      'Medieval_Shadow_Male_dead_diag',
      'Medieval_Shadow_Male_ko_diag',
      'Medieval_Shadow_Male_kneel_diag',
      'Medieval_Shadow_Male_sitting1_diag',
      'Medieval_Shadow_Male_sitting2_diag',
      'Medieval_Shadow_Male_sleeping_diag',
      'Medieval_Shadow_Male_MVsv_alt_attack1',
      'Medieval_Shadow_Male_MVsv_alt_attack2',
      'Medieval_Shadow_Male_MVsv_alt_critical1',
      'Medieval_Shadow_Male_MVsv_alt_critical2',
      'Medieval_Shadow_Male_MVsv_alt_critical3',
      'Medieval_Shadow_Male_MVsv_alt_critical4',
      'Medieval_Shadow_Male_MVsv_alt_critical5',
      'Medieval_Shadow_Male_MVsv_alt_critical6',
      'Medieval_Shadow_Male_MVsv_alt_dead1',
      'Medieval_Shadow_Male_MVsv_alt_dead2',
      'Medieval_Shadow_Male_MVsv_alt_dead3',
      'Medieval_Shadow_Male_MVsv_alt_magic',
      'Medieval_Shadow_Male_MVsv_alt_martialartpunch',
      'Medieval_Shadow_Male_MVsv_alt_martialartcritical',
      'Medieval_Shadow_Male_MVsv_alt_martialartstance',
      'Medieval_Shadow_Male_MVsv_alt_shooting',
      'Medieval_Shadow_Male_MVsv_alt_shootingstance',
      'Medieval_Shadow_Male_MVsv_alt_stance1',
      'Medieval_Shadow_Male_MVsv_alt_stance2',
      'Medieval_Shadow_Male_MVsv_alt_stance3',
      'Medieval_Shadow_Male_MVsv_alt_stance4',
      'Medieval_Shadow_Male_MVsv_alt_stance5',
      'Medieval_Shadow_Male_MVsv_alt_stance6',
      'Medieval_Shadow_Male_MVsv_alt_victory1',
      'Medieval_Shadow_Male_MVsv_alt_victory2',
      'Medieval_Shadow_Male_MVsv_alt_victory3',
      'Medieval_Shadow_Male_MVsv_alt_victory4',
      'Medieval_Shadow_Male_MVsv_alt_victory5',
      'Medieval_Shadow_Male_MVsv_alt_victory6',
      'Medieval_Shadow_Male_MVsv_alt_victory7',
      'Medieval_Shadow_Male_MVsv_alt_victory8',
    ];

    const opts = { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE };
    legacySheets.forEach(({ key, path }) => scene.load.spritesheet(key, path, opts));
    newKeys.forEach(key => scene.load.spritesheet(key, `${BASE}${key}.png`, opts));
    shadowKeys.forEach(key => scene.load.spritesheet(key, `${SHADOW_BASE}${key}.png`, opts));
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

  // ── Animations ──

  // TODO: move to src/scene/loadAssets.js (or playerAnims.js)
  // — animation registration is scene lifecycle work, not
  // entity behaviour
  /**
   * Registers all base player animations with the Phaser animation manager.
   * Must be called once after preload(), before any sprites are played.
   * Equipment items register their own animations when equipped.
   * @param {Phaser.Scene} scene
   */
  static createAnims(scene) {
    const anims = [
      // Player walk
      { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
      { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
      { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },

      // Player idle
      { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },

      // Player attack
      { key: "attack1", frames: scene.anims.generateFrameNumbers("Medieval_Warfare_Male_1_MVsv_alt_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "attack2", frames: scene.anims.generateFrameNumbers("Medieval_Warfare_Male_1_MVsv_alt_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    ];

    // Helpers for building directional _diag animation groups.
    // Row layout: SW=row 0, NW=row 1, SE=row 2, NE=row 3 (matches idle/walk pattern).
    const diag3 = (key, sheet, rate, rep) => [
      { key: `${key}_sw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 0,  end: 2  }), frameRate: rate, repeat: rep },
      { key: `${key}_nw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 3,  end: 5  }), frameRate: rate, repeat: rep },
      { key: `${key}_se`, frames: scene.anims.generateFrameNumbers(sheet, { start: 6,  end: 8  }), frameRate: rate, repeat: rep },
      { key: `${key}_ne`, frames: scene.anims.generateFrameNumbers(sheet, { start: 9,  end: 11 }), frameRate: rate, repeat: rep },
    ];
    const diag8 = (key, sheet, rate, rep) => [
      { key: `${key}_sw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 0,  end: 7  }), frameRate: rate, repeat: rep },
      { key: `${key}_nw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 8,  end: 15 }), frameRate: rate, repeat: rep },
      { key: `${key}_se`, frames: scene.anims.generateFrameNumbers(sheet, { start: 16, end: 23 }), frameRate: rate, repeat: rep },
      { key: `${key}_ne`, frames: scene.anims.generateFrameNumbers(sheet, { start: 24, end: 31 }), frameRate: rate, repeat: rep },
    ];
    // Single-row MVsv_alt sheets — 3 frames, no directional variants.
    const mv = (key, sheet, rate, rep) =>
      ({ key, frames: scene.anims.generateFrameNumbers(sheet, { start: 0, end: 2 }), frameRate: rate, repeat: rep });

    const newAnims = [
      // Directional _diag animations (3 frames/dir × 4 dirs)
      ...diag3('collapse', 'Medieval_Warfare_Male_1_collapse_diag',  8,  0),
      ...diag3('dead',     'Medieval_Warfare_Male_1_dead_diag',      8,  0),
      ...diag3('ko',       'Medieval_Warfare_Male_1_ko_diag',        8,  0),
      ...diag8('run',      'Medieval_Warfare_Male_1_running_diag',   10, -1),
      ...diag3('kneel',    'Medieval_Warfare_Male_1_kneel_diag',     6,  0),
      ...diag3('sit1',     'Medieval_Warfare_Male_1_sitting1_diag',  6,  0),
      ...diag3('sit2',     'Medieval_Warfare_Male_1_sitting2_diag',  6,  0),
      ...diag3('sleep',    'Medieval_Warfare_Male_1_sleeping_diag',  6,  0),

      // MVsv_alt non-directional animations (3 frames each)
      ...[1,2,3,4,5,6].map(n => mv(`critical${n}`,  `Medieval_Warfare_Male_1_MVsv_alt_critical${n}`,  12, 0)),
      ...[1,2,3].map(n =>       mv(`mvdead${n}`,    `Medieval_Warfare_Male_1_MVsv_alt_dead${n}`,       8, 0)),
      mv('magic',            'Medieval_Warfare_Male_1_MVsv_alt_magic',            10, 0),
      ...[1,2,3,4,5,6,7,8].map(n => mv(`victory${n}`, `Medieval_Warfare_Male_1_MVsv_alt_victory${n}`, 10, 0)),
      mv('shooting',         'Medieval_Warfare_Male_1_MVsv_alt_shooting',         10, 0),
      mv('shootingstance',   'Medieval_Warfare_Male_1_MVsv_alt_shootingstance',   10, 0),
      ...[1,2,3,4,5,6].map(n => mv(`stance${n}`,    `Medieval_Warfare_Male_1_MVsv_alt_stance${n}`,     6, 0)),
      mv('martialartpunch',    'Medieval_Warfare_Male_1_MVsv_alt_martialartpunch',    12, 0),
      mv('martialartcritical', 'Medieval_Warfare_Male_1_MVsv_alt_martialartcritical', 12, 0),
      mv('martialartstance',   'Medieval_Warfare_Male_1_MVsv_alt_martialartstance',   12, 0),
    ];

    // Shadow animations — 'shadow_' prefix, mirrors every body anim key.
    const S = 'Medieval_Shadow_Male_';
    const shadowAnims = [
      // Directional _diag
      ...diag8('shadow_walk',     S + 'walking_diag',   8,  -1),
      ...diag3('shadow_idle',     S + 'idle1_diag',     6,  -1),
      ...diag8('shadow_run',      S + 'running_diag',   10, -1),
      ...diag3('shadow_collapse', S + 'collapse_diag',  8,   0),
      ...diag3('shadow_dead',     S + 'dead_diag',      8,   0),
      ...diag3('shadow_ko',       S + 'ko_diag',        8,   0),
      ...diag3('shadow_kneel',    S + 'kneel_diag',     6,   0),
      ...diag3('shadow_sit1',     S + 'sitting1_diag',  6,   0),
      ...diag3('shadow_sit2',     S + 'sitting2_diag',  6,   0),
      ...diag3('shadow_sleep',    S + 'sleeping_diag',  6,   0),
      // MVsv_alt
      mv('shadow_attack1',          S + 'MVsv_alt_attack1',          8,  0),
      mv('shadow_attack2',          S + 'MVsv_alt_attack2',          8,  0),
      ...[1,2,3,4,5,6].map(n => mv(`shadow_critical${n}`,  S + `MVsv_alt_critical${n}`,  12, 0)),
      ...[1,2,3].map(n =>       mv(`shadow_mvdead${n}`,    S + `MVsv_alt_dead${n}`,       8,  0)),
      mv('shadow_magic',            S + 'MVsv_alt_magic',            10, 0),
      mv('shadow_shooting',         S + 'MVsv_alt_shooting',         10, 0),
      mv('shadow_shootingstance',   S + 'MVsv_alt_shootingstance',   10, 0),
      ...[1,2,3,4,5,6].map(n => mv(`shadow_stance${n}`,    S + `MVsv_alt_stance${n}`,     6,  0)),
      mv('shadow_martialartpunch',    S + 'MVsv_alt_martialartpunch',    12, 0),
      mv('shadow_martialartcritical', S + 'MVsv_alt_martialartcritical', 12, 0),
      mv('shadow_martialartstance',   S + 'MVsv_alt_martialartstance',   12, 0),
      ...[1,2,3,4,5,6,7,8].map(n => mv(`shadow_victory${n}`, S + `MVsv_alt_victory${n}`, 10, 0)),
    ];

    [...anims, ...newAnims, ...shadowAnims].forEach(anim => scene.anims.create(anim));
  }
}
