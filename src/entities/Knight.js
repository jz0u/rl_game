import Character from './Character.js';
import { knightBaseStats } from '../data/baseStats.js';

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
 * Knight — the playable character. Extends Character.
 *
 * Adds:
 *   - Equipment overlay sprites (one per slot) kept in sync via _syncOverlays()
 *   - syncEquipment(equippedMap) — called by EquipmentManager on equipment changes
 *   - attack(pointerX) — overrides Character.attack to use weapon type + pointer position
 *   - triggerCritical() — plays a random critical-hit animation
 *   - invincibility frames after taking damage
 *   - this.balance — currency for the shop system
 *
 * animPrefix = '' so Character._animKey() returns bare keys ('walk_sw', 'idle_sw', etc.)
 * that match the pre-registered player animations.
 */
export default class Knight extends Character {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Initial world X position.
   * @param {number} y - Initial world Y position.
   */
  constructor(scene, x, y) {
    // animPrefix='' → bare anim keys, no prefix ('walk_sw' etc.)
    super(scene, x, y, knightBaseStats, '', true);

    // Shadow behind the base body sprite.
    this.shadow = scene.add.sprite(x, y, 'Medieval_Shadow_Male_idle1_diag');
    this.shadow.setAlpha(0.4);

    this.sprite = scene.physics.add.sprite(x, y, 'Medieval_Warfare_Male_1_idle1_diag');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 32);
    this.sprite.body.setOffset(48, 80);

    /** Currency balance — used by Shop.buy(). */
    this.balance = 0;

    /**
     * One overlay sprite per equipment slot; null when the slot is empty.
     * Each overlay mirrors the body's animation direction each frame.
     */
    this.overlays = {
      head:       null,
      shoulder:   null,
      hands:      null,
      body_inner: null,
      body_outer: null,
      legs:       null,
      feet:       null,
      primary:    null,
      secondary:  null,
      amulet:     null,
    };

    this.hasWeapon   = false;
    this.weaponType  = null;  // null | 'melee' | 'ranged' | 'magic'
    this.invincible  = false;

    // Register animationcomplete handler (defined in Character).
    // Must be called after this.sprite is created.
    this._registerAnimComplete();

    // Knight hits living goblins.
    this.targets = () => (this.scene.goblins ?? []).filter(g => !g.isDead());
  }

  // ── Combat (Knight-specific) ──

  takeDamage(amount, type, attackerX, guardDamage = 10) {
    if (this.invincible) return 0;
    // Character.takeDamage → Entity.takeDamage + _applyStagger
    const effective = super.takeDamage(amount, type, attackerX, guardDamage);
    this._applyHitReaction(this.sprite, attackerX);
    this.invincible = true;
    this.scene.time.delayedCall(500, () => { this.invincible = false; });
    return effective;
  }

  _applyHitReaction(anchor, attackerX) {
    // Flash all active overlays to match the base-sprite white tint.
    const overlaySprites = Object.values(this.overlays).filter(Boolean);
    for (const s of overlaySprites) s.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      for (const s of overlaySprites) s.clearTint();
    });
    super._applyHitReaction(anchor, attackerX);
  }

  onDeath() {
    console.log('knight died');
  }

  /**
   * Triggers an attack toward the given X coordinate (pointer world X).
   * Overrides Character.attack(angle) to:
   *   - Set flipX from pointer position
   *   - Pick weapon-specific arc/range
   *   - Compute the angle from sprite to pointer
   * Then delegates to Character.attack(angle) for arc display + animation.
   *
   * @param {number} pointerX - World X of the click, used for facing + angle calculation.
   */
  attack(pointerX) {
    if (this.attackInProgress) return;

    this.sprite.flipX = pointerX > this.sprite.x;

    const weapon = this.scene.inventory?.equipped?.get('primary');
    this.currentAttackRange = weapon?.attackRange ?? this.derivedStats.attackRange;
    this.currentArcType     = weapon?.arcType     ?? 'stab';

    const angle = Math.atan2(
      this.scene.input.activePointer.worldY - this.sprite.y,
      this.scene.input.activePointer.worldX - this.sprite.x,
    );

    // Character.attack() sets attackInProgress, shows effects, plays anim.
    super.attack(angle);
  }

  _getAttackAnim() {
    switch (this.weaponType) {
      case 'melee':  return 'attack1';
      case 'ranged': return this.weaponSubtype === 'bow' ? 'attack1' : 'shooting';
      case 'magic':  return 'magic';
      default:       return 'martialartpunch';
    }
  }

  getIdleAnim() {
    if (this.weaponType === 'ranged') return 'shootingstance';
    return super.getIdleAnim();
  }

  /** Called by Character's animationcomplete handler before movement resumes. */
  _onAttackAnimComplete() {
    this._syncOverlays();
  }

  /**
   * Triggers a random critical-hit animation.
   * Blocks movement and re-triggering until the animation completes.
   */
  triggerCritical() {
    if (this.attackInProgress) return;
    this.attackInProgress = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.play(`critical${Phaser.Math.Between(1, 6)}`);
  }

  // ── Equipment ──

  /**
   * Places an equipment overlay sprite for the given item's slot.
   * Destroys any existing overlay for that slot first.
   * The item's spritesheets and animations must be pre-loaded before calling this.
   */
  equip(item) {
    if (this.overlays[item.equipSlot]) this.overlays[item.equipSlot].destroy();

    const textureKey = item.staticOverlay
      ? item.id + '_overlay'
      : `${item.baseName}_idle1_diag`;

    const overlay = this.scene.add.sprite(this.sprite.x, this.sprite.y, textureKey);
    overlay.baseName = item.baseName;
    overlay.isStatic = !!item.staticOverlay;
    overlay.setDepth(OVERLAY_DEPTH[item.equipSlot] ?? 0);
    this.overlays[item.equipSlot] = overlay;
  }

  /**
   * Syncs all overlay sprites to match the given equipped Map.
   * Called by the EquipmentManager 'equipmentChanged' event listener.
   * @param {Map<string, object|null>} equippedMap - slot → item|null
   */
  syncEquipment(equippedMap) {
    for (const [slot, item] of equippedMap) {
      if (item !== null) this.equip(item);
      else               this.unequip(slot);
    }

    const primary    = equippedMap.get('primary');
    this.hasWeapon   = primary != null;

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
   * Removes the overlay for the given slot, if one exists.
   * @param {string} slot - Equipment slot key ('head', 'primary', etc.)
   */
  unequip(slot) {
    if (this.overlays[slot]) {
      this.overlays[slot].destroy();
      this.overlays[slot] = null;
    }
  }

  /**
   * Locks all overlay sprites to the body sprite position and animation.
   * Called every frame so overlays track the body even when idle.
   */
  _syncOverlays() {
    const currentAnim = this.sprite.anims.currentAnim?.key;

    // Sync shadow
    this.shadow.x     = this.sprite.x;
    this.shadow.y     = this.sprite.y;
    this.shadow.flipX = this.sprite.flipX;
    if (currentAnim) {
      const shadowAnim = 'shadow_' + currentAnim;
      if (this.shadow.anims.currentAnim?.key !== shadowAnim && this.scene.anims.exists(shadowAnim)) {
        this.shadow.play(shadowAnim, true);
      }
    }

    // Sync equipment overlays
    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (!overlay) continue;

      overlay.x     = this.sprite.x;
      overlay.y     = this.sprite.y;
      overlay.flipX = this.sprite.flipX;

      if (!currentAnim || overlay.isStatic) continue;

      const weaponAnim = overlay.baseName + '_' + currentAnim;
      if (overlay.anims.currentAnim?.key !== weaponAnim && this.scene.anims.exists(weaponAnim)) {
        overlay.play(weaponAnim, true);
      }
    }
  }

  _checkCoinPickups() {
    const coins = this.scene.coinDrops;
    if (!coins?.length) return;
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      if (coin.collected) { coins.splice(i, 1); continue; }
      if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, coin.x, coin.y) <= this.derivedStats.visionRadius) {
        this.scene.bank?.deposit(coin.value);
        coin.collect();
        coins.splice(i, 1);
      }
    }
  }

  // ── Game loop ──

  update() {
    // Overlays must sync before Character.update() in case movement state changes.
    this._syncOverlays();
    super.update();
    this._checkCoinPickups();
  }
}
