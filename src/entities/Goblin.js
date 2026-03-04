import EnemyAI from './EnemyAI.js';
import { goblinBaseStats } from '../data/baseStats.js';
import CoinDrop from './CoinDrop.js';

/**
 * Goblin — a basic melee enemy with goblin-specific personality traits.
 *
 * Extends EnemyAI for the shared state machine. Overrides three hooks
 * to add goblin character: random speed variance, randomised attack hesitation,
 * and a short lunge burst at attack start.
 */
export default class Goblin extends EnemyAI {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Spawn X.
   * @param {number} y - Spawn Y.
   */
  constructor(scene, x, y) {
    super(scene, x, y, goblinBaseStats, 'goblin');

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

    this.createHealthBar(x, y);

    this.sprite.play('goblin_idle_sw');

    // Personality: each goblin runs at a slightly different speed.
    this.speedMultiplier  = Phaser.Math.FloatBetween(0.85, 1.15);
    // Personality: random hesitation before each swing.
    this.attackDelayUntil = 0;
  }

  // ── Goblin personality overrides ──

  /** Chase with per-goblin speed variance. */
  _onChase(tx, ty) {
    if (this.attackInProgress) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    let vx = Math.cos(angle) * this.derivedStats.moveSpeed * 60;
    let vy = Math.sin(angle) * this.derivedStats.moveSpeed * 60;

    // Separation steering — nudge away from nearby enemies to prevent clumping.
    const SEPARATION = 60;
    const peers = this.scene.enemies ?? this.scene.goblins ?? [];
    for (const other of peers) {
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

    // Apply per-goblin speed personality.
    vx *= this.speedMultiplier;
    vy *= this.speedMultiplier;

    this.sprite.body.setVelocity(vx, vy);

    const walkAnim = this._animKey(this.getDirectionAnim(angle));
    if (this.sprite.anims.currentAnim?.key !== walkAnim) {
      this.sprite.play(walkAnim);
    }
    this.sprite.flipX = false;
  }

  /** Attack with random hesitation delay and a lunge burst. */
  _onAttack(px, py) {
    if (this.scene.time.now < this.attackDelayUntil) return;
    if (this.attackInProgress) return;
    if (this.scene.time.now < this.staggerUntil) return;

    // Set the next attack's hesitation window before swinging.
    this.attackDelayUntil = this.scene.time.now + Phaser.Math.Between(200, 600);

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    this.attack(angle);

    // Brief lunge burst toward the player after attack() zeroes velocity.
    this.scene.time.delayedCall(50, () => {
      if (this.attackInProgress && !this.isDead()) {
        this.sprite.body.setVelocity(
          Math.cos(angle) * 180,
          Math.sin(angle) * 180,
        );
        this.scene.time.delayedCall(80, () => {
          if (!this.isDead()) this.sprite.body.setVelocity(0, 0);
        });
      }
    });
  }

  onDeath() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    if (this.sprite.body) this.sprite.body.setVelocity(0, 0);

    const drop = new CoinDrop(this.scene, this.sprite.x, this.sprite.y, this.baseStats.coinValue ?? 1);
    this.scene.coinDrops ??= [];
    this.scene.coinDrops.push(drop);

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
}
