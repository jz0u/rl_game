import Character from './Character.js';
import { goblinBaseStats } from '../data/baseStats.js';

/**
 * Goblin — an AI-controlled enemy that extends Character.
 *
 * Uses real sprite animations (idle, walk, attack, collapse).
 * Has a 4-state AI machine: idle → chase → attack → dead.
 *
 * Setting playable = true on this class would make it respond to
 * moveTo() / attack() calls with no other changes needed.
 */
export default class Goblin extends Character {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Spawn X.
   * @param {number} y - Spawn Y.
   */
  constructor(scene, x, y) {
    super(scene, x, y, goblinBaseStats, 'goblin', false);

    this.sprite = scene.physics.add.sprite(x, y, 'goblin_idle1_diag');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 48);
    this.sprite.body.setOffset(48, 72);

    // hitbox = this.sprite (set by _registerAnimComplete below)
    this._registerAnimComplete();

    // Goblin hits the knight.
    this.targets = () => {
      const knight = this.scene.knight;
      return knight ? [knight] : [];
    };

    // AI
    this.state = 'idle';

    this.createHealthBar(x, y);

    this.sprite.play('goblin_idle_sw');
  }

  // ── Combat (enemy-style: health bar + damage numbers) ──

  takeDamage(amount, type = 'physical', attackerX = null, guardDamage = 10) {
    const effective = super.takeDamage(amount, type, attackerX, guardDamage);  // → Character.takeDamage
    this.updateHealthBar();
    this.showDamageNumber(effective);
    this._applyHitReaction(this.hitbox, attackerX);
    return effective;
  }

  onDeath() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
    // No registry to unregister from — isDead() filters this goblin out naturally.

    // Play collapse in the current idle direction (defaults to SW).
    const idleKey     = this.getIdleAnim();
    const collapseKey = idleKey.replace('idle_', 'collapse_');
    if (this.scene.anims.exists(collapseKey)) {
      this.sprite.play(collapseKey);
    }

    // Null the refs immediately so updateHealthBar() returns safely
    // during the tween's delay before actual destruction.
    const healthBar = this.healthBar;
    const hpLabel   = this.hpLabel;
    this.healthBar  = null;
    this.hpLabel    = null;

    this.scene.tweens.add({
      targets:    [this.sprite, healthBar, hpLabel],
      alpha:      0,
      delay:      400,
      duration:   300,
      onComplete: () => {
        this.sprite.destroy();
        healthBar.destroy();
        hpLabel.destroy();
      },
    });
  }

  // ── AI update ──

  update() {
    this.updateHealthBar();

    // When playable=true, delegate to Character's moveTo-based movement.
    if (this.playable) {
      super.update();
      return;
    }

    if (this.state === 'dead') return;

    const { x: px, y: py } = this.scene.actions.getKnightPosition();
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, px, py);

    switch (this.state) {
      case 'idle':
        this._setIdle();
        if (dist < this.derivedStats.aggroRadius) this.state = 'chase';
        break;

      case 'chase':
        if (dist > this.derivedStats.aggroRadius * 1.5) {
          this.state = 'idle';
          this._setIdle();
        } else if (dist < this.derivedStats.attackRange) {
          this.state = 'attack';
          this.sprite.body.setVelocity(0, 0);
        } else {
          this._chaseKnight(px, py);
        }
        break;

      case 'attack':
        if (dist > this.derivedStats.attackRange) {
          this.state = 'chase';
        } else if (!this.attackInProgress) {
          if (this.scene.time.now < this.staggerUntil) return;
          const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
          // currentArcType and currentAttackRange already set to melee defaults in constructor.
          this.attack(angle);
        }
        break;

      case 'dead':
        // Handled by onDeath — should never reach here after first frame.
        break;
    }
  }

  // ── Private AI helpers ──

  _setIdle() {
    if (!this.attackInProgress) {
      this.sprite.body.setVelocity(0, 0);
      const idleAnim = this.getIdleAnim();
      if (this.sprite.anims.currentAnim?.key !== idleAnim) {
        this.sprite.play(idleAnim);
      }
    }
  }

  _chaseKnight(px, py) {
    if (this.attackInProgress) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    let vx = Math.cos(angle) * this.derivedStats.moveSpeed * 60;
    let vy = Math.sin(angle) * this.derivedStats.moveSpeed * 60;

    // Separation steering — nudge away from nearby goblins to prevent clumping.
    const SEPARATION = 60;
    for (const other of (this.scene.goblins ?? [])) {
      if (other === this || other.isDead()) continue;
      const anchor = other.sprite ?? other.rect;
      if (!anchor) continue;
      const dx = this.sprite.x - anchor.x;
      const dy = this.sprite.y - anchor.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 0 && d < SEPARATION) {
        const strength = (SEPARATION - d) / SEPARATION;
        vx += (dx / d) * strength * this.derivedStats.moveSpeed * 60;
        vy += (dy / d) * strength * this.derivedStats.moveSpeed * 60;
      }
    }

    this.sprite.body.setVelocity(vx, vy);

    // Play walk animation in the direction of movement.
    const walkAnim = this._animKey(this.getDirectionAnim(angle));
    if (this.sprite.anims.currentAnim?.key !== walkAnim) {
      this.sprite.play(walkAnim);
    }
    this.sprite.flipX = false;
  }
}
