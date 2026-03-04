import Entity from './Entity.js';
import CombatEffects from '../effects/CombatEffects.js';
import { COLOR_HP_BAR_BG, COLOR_DAMAGE_RED } from '../config/constants.js';
const GUARD_BREAK_STAGGER_MS = 800; // 8 frames at 10fps

/** Half-arc angles (radians) for each weapon arc type used in canHit(). */
const ARC_HALF = {
  stab:   Math.PI / 8,         // ~22.5° each side = 45° total
  medium: (Math.PI * 3) / 8,  // ~67.5° each side = 135° total
  wide:   (Math.PI * 5) / 8,  // ~112.5° each side = 225° total
};

const BAR_WIDTH    = 40;
const BAR_HEIGHT   = 5;
const BAR_Y_OFFSET = -35;

/**
 * Character — base class for any living entity with a sprite, movement, and combat.
 *
 * Extends Entity (stats, takeDamage, heal, isDead, onDeath).
 * Provides:
 *   - Phaser physics sprite + hitbox alias
 *   - moveTo(x, y) / update() movement loop
 *   - attack(angle) with arc visualisation
 *   - canHit(target) arc-geometry hit detection
 *   - animationcomplete handler that runs hit detection against this.targets()
 *   - Health bar, damage number display
 *
 * Subclasses must:
 *   1. Create this.sprite (physics sprite) in their constructor.
 *   2. Call this._registerAnimComplete() after creating the sprite.
 *   3. Set this.targets = () => [...] to define what this character can hit.
 */
export default class Character extends Entity {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} baseStats
   * @param {string} animPrefix - Prefix for animation keys, e.g. 'goblin' → 'goblin_walk_sw'.
   *                              Use '' (empty string) for characters that use bare anim keys.
   * @param {boolean} playable  - True if this character is controlled by the player.
   */
  constructor(scene, x, y, baseStats, animPrefix, playable) {
    super(scene, baseStats);

    this.animPrefix   = animPrefix ?? '';
    this.playable     = playable   ?? false;

    this.moveTarget       = null;
    this.attackInProgress = false;
    this.attackAngle      = 0;
    this.currentArcType   = 'stab';
    this.currentAttackRange = baseStats.attackRange ?? 70;
    this.staggerUntil     = 0;      // scene.time.now value after which stagger expires
    this.attackId         = null;   // cancel token — invalidated when an attack is staggered out

    /**
     * Returns the array of characters this entity can damage during an attack.
     * Set by subclass constructor:
     *   Knight:  () => this.scene.goblins.filter(g => !g.isDead())
     *   Goblin:  () => [this.scene.knight]
     */
    this.targets = () => [];

    // this.sprite and this.hitbox are initialised after the subclass
    // creates the physics sprite and calls _registerAnimComplete().
  }

  // ── Sprite / animation setup ──

  /**
   * Registers the animationcomplete handler on this.sprite and sets up
   * this.hitbox as an alias. Call once from subclass constructor after
   * creating this.sprite.
   */
  _registerAnimComplete() {
    this.hitbox = this.sprite;

    this.sprite.on('animationcomplete', () => {
      // Capture cancel token NOW — before we clear attackInProgress — so
      // a stagger that arrived mid-animation can invalidate this swing.
      const thisAttack = this.attackId;

      // Save the flag before clearing it so we know whether a hit-detection
      // animation (attack) completed vs. a one-shot death/stagger animation.
      const wasAttacking = this.attackInProgress;
      this.attackInProgress = false;
      this._onAttackAnimComplete();

      // Dead characters don't resume movement.
      if (this.isDead()) return;

      // Resume movement or return to idle after attack animation.
      if (this.moveTarget) {
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y,
          this.moveTarget.x, this.moveTarget.y,
        );
        this.sprite.play(this._animKey(this.getDirectionAnim(angle)));
      } else {
        this.sprite.play(this.getIdleAnim());
      }

      // Hit detection only runs after an attack animation, not after
      // collapse / stagger / any other one-shot non-looping animation.
      if (!wasAttacking) return;

      // If this swing was staggered out, its cancel token will have been
      // nulled — don't deal damage from the cancelled animation.
      if (this.attackId !== thisAttack) return;

      for (const t of this.targets()) {
        const box = t.hitbox ?? t.rect ?? t.sprite;
        if (!box || !this.canHit(box)) continue;

        t.takeDamage(
          this.derivedStats.physicalDamage,
          'physical',
          this.sprite.x,
          this.derivedStats.guardDamage,
        );

        const hitX = (this.sprite.x + box.x) / 2;
        const hitY = (this.sprite.y + box.y) / 2;
        CombatEffects.showImpactFlash(this.scene, hitX, hitY);
        CombatEffects.showParticleBurst(this.scene, hitX, hitY);
        this.scene.cameras.main.shake(150, 0.004);

        // Brief hit-pause — freeze physics + animations.
        this.scene.physics.pause();
        this.scene.anims.pauseAll();
        this.scene.time.delayedCall(80, () => {
          this.scene.physics.resume();
          this.scene.anims.resumeAll();
        });
      }
    });
  }

  /** Hook called right after the attack animation completes, before movement resumes. */
  _onAttackAnimComplete() {}

  /**
   * Builds a full animation key from a base suffix using this.animPrefix.
   *   animPrefix=''       → _animKey('walk_sw') = 'walk_sw'   (Knight)
   *   animPrefix='goblin' → _animKey('walk_sw') = 'goblin_walk_sw'  (Goblin)
   */
  _animKey(base) {
    return this.animPrefix ? `${this.animPrefix}_${base}` : base;
  }

  // ── Animation helpers (prefix-aware overrides of Entity versions) ──

  /**
   * Returns the idle animation key matching the character's current facing direction.
   * Overrides Entity.getIdleAnim() to respect this.animPrefix.
   */
  getIdleAnim() {
    const anchor  = this.sprite ?? this.rect;
    const current = anchor?.anims?.currentAnim?.key;
    const pfx     = this.animPrefix ? this.animPrefix + '_' : '';

    if (current?.startsWith(pfx + 'walk_')) return current.replace(pfx + 'walk_', pfx + 'idle_');
    if (current?.startsWith(pfx + 'idle_')) return current;
    return pfx + 'idle_sw';
  }

  // ── Movement ──

  /**
   * Sets the world-space position the character should walk toward.
   * Used by playable characters (via input) and optionally by AI.
   */
  moveTo(x, y) {
    this.moveTarget = { x, y };
  }

  // ── Combat ──

  /**
   * Triggers an attack toward the given angle (radians).
   * Shows arc + slash trail, sets attackInProgress, and plays the attack animation.
   * currentArcType and currentAttackRange should be set by the caller before calling attack().
   *
   * @param {number} angle - World-space angle in radians from attacker to target.
   */
  attack(angle) {
    if (this.attackInProgress) return;
    if (this.scene.time.now < this.staggerUntil) return;

    this.attackId         = Symbol();   // new token per attack swing
    this._spendStamina(this.derivedStats.staminaCost);
    this.attackInProgress = true;
    if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
    this.attackAngle      = angle;
    this.sprite.flipX     = Math.cos(angle) > 0;

    CombatEffects.showArc(
      this.scene, this.sprite.x, this.sprite.y,
      angle, this.currentArcType, this.currentAttackRange,
    );
    CombatEffects.showSlashTrail(
      this.scene, this.sprite.x, this.sprite.y,
      angle, this.currentArcType, this.currentAttackRange,
    );

    this.sprite.play(this._getAttackAnim());
  }

  /**
   * Returns the animation key for the attack animation.
   * Override in subclasses for weapon-dependent logic.
   */
  _getAttackAnim() {
    return this._animKey('attack1');
  }

  /**
   * Arc-geometry hit check. Returns true if the target's bounding box
   * intersects the current attack arc.
   *
   * @param {Phaser.GameObjects.GameObject} target - The hitbox to test. May be a
   *   physics-enabled sprite or rectangle. Uses body dimensions when available.
   */
  canHit(target) {
    const w  = target.body?.width  ?? target.width  ?? 40;
    const h  = target.body?.height ?? target.height ?? 60;
    const hw = w / 2;
    const hh = h / 2;

    // Test 5 points on the target's bounding box (corners + centre).
    const points = [
      { x: target.x - hw, y: target.y - hh },
      { x: target.x + hw, y: target.y - hh },
      { x: target.x - hw, y: target.y + hh },
      { x: target.x + hw, y: target.y + hh },
      { x: target.x,      y: target.y      },
    ];

    const range = this.currentAttackRange;
    const half  = ARC_HALF[this.currentArcType ?? 'stab'];

    return points.some(({ x, y }) => {
      const dx = x - this.sprite.x;
      const dy = y - this.sprite.y;
      if (dx * dx + dy * dy > range * range) return false;
      let diff = Math.abs(Math.atan2(dy, dx) - this.attackAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      return diff <= half;
    });
  }

  // ── Damage / stagger ──

  /**
   * Intercepts Entity.takeDamage to apply stagger on every effective hit.
   * Subclasses should call super.takeDamage(...) which routes here.
   */
  takeDamage(amount, type = 'physical', attackerX = null, guardDamage = 10) {
    const effective = super.takeDamage(amount, type);   // Entity.takeDamage
    this._applyHitReaction(this.hitbox, attackerX);
    this._spendStamina(guardDamage);
    return effective;
  }

  /**
   * Guard-break stagger: cancels any in-progress attack, plays the guard_break
   * animation, and blocks new attacks for `duration` ms.
   */
  _applyStagger(duration) {
    if (this.attackInProgress) {
      this.attackInProgress = false;
      this.attackId = null;
      this.sprite.stop();
    }

    this.staggerUntil = this.scene.time.now + duration;

    const animKey = this._animKey('guard_break');
    this.sprite.play(animKey);

    this.sprite.once('animationcomplete', () => {
      this.sprite.play(this._animKey('idle_sw'));
    });
  }

  _spendStamina(amount) {
    this.currentStamina -= amount;
    if (this.currentStamina <= 0) {
      this.currentStamina = this.derivedStats.maxStamina;
      this._applyStagger(GUARD_BREAK_STAGGER_MS);
    }
  }

  // ── Health bar ──

  /**
   * Creates a health bar + HP label above the entity.
   * Call from subclass constructor after creating this.sprite / this.hitbox.
   */
  createHealthBar(x, y) {
    this.healthBar = this.scene.add.graphics();
    this.hpLabel   = this.scene.add.text(x, y - 45, '', {
      fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.updateHealthBar();
  }

  /** Redraws the health bar to reflect currentHp. */
  updateHealthBar() {
    const anchor = this.hitbox ?? this.rect;
    if (!anchor || !this.healthBar) return;

    const bx = anchor.x - BAR_WIDTH / 2;
    const by = anchor.y + BAR_Y_OFFSET;

    this.healthBar.clear();
    this.healthBar.fillStyle(COLOR_HP_BAR_BG);
    this.healthBar.fillRect(bx, by, BAR_WIDTH, BAR_HEIGHT);

    const ratio = this.currentHp / this.derivedStats.maxHP;
    this.healthBar.fillStyle(COLOR_DAMAGE_RED);
    this.healthBar.fillRect(bx, by, BAR_WIDTH * ratio, BAR_HEIGHT);

    this.hpLabel.setText(`${Math.ceil(this.currentHp)} / ${this.derivedStats.maxHP}`);
    this.hpLabel.setPosition(anchor.x, anchor.y - 45);
  }

  /** Shows a floating damage number above the entity. */
  showDamageNumber(amount) {
    const anchor = this.hitbox ?? this.rect ?? this.sprite;
    const ax = anchor?.x ?? 0;
    const ay = anchor?.y ?? 0;

    const text = this.scene.add.text(ax, ay - 20, String(amount), {
      fontSize: '12px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 1);
    this.scene.tweens.add({
      targets:    text,
      y:          ay - 60,
      alpha:      0,
      duration:   800,
      onComplete: () => text.destroy(),
    });
  }

  // ── Game loop (moveTo-based movement — used by playable characters) ──

  /**
   * Advances movement toward this.moveTarget each frame.
   * AI-controlled characters (Goblin) handle their own velocity and do not
   * call super.update() unless playable=true.
   */
  update() {
    // Stamina regeneration.
    const delta = this.scene.game.loop.delta / 1000;
    this.currentStamina = Math.min(
      this.derivedStats.maxStamina,
      this.currentStamina + this.derivedStats.staminaRegen * delta,
    );

    // Ensure the body is stopped when no target is set.
    if (!this.moveTarget && this.sprite?.body) {
      this.sprite.body.setVelocity(0, 0);
    }
    if (this.attackInProgress) return;
    if (!this.moveTarget) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    // flipX=false: directional animations convey facing, no mirroring needed during movement.
    this.sprite.flipX = false;
    const walkAnim = this._animKey(this.getDirectionAnim(angle));
    if (this.sprite.anims.currentAnim?.key !== walkAnim) {
      this.sprite.play(walkAnim);
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    // * 2 gives ~2 frames of lookahead at 60fps to prevent oscillation.
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
      // If body was blocked by a collider, cancel the move target.
      if (
        this.sprite.body.blocked.left  ||
        this.sprite.body.blocked.right ||
        this.sprite.body.blocked.up    ||
        this.sprite.body.blocked.down
      ) {
        this.sprite.body.setVelocity(0, 0);
        this.moveTarget = null;
        this.sprite.play(this.getIdleAnim());
      }
    }
  }
}
