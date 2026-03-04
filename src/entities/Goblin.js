import EnemyAI from './EnemyAI.js';
import { goblinBaseStats } from '../data/baseStats.js';
import CoinDrop from './CoinDrop.js';

/**
 * Goblin — a basic melee enemy with goblin-specific personality traits.
 *
 * Extends EnemyAI for the shared state machine. Adds:
 *   - Speed variance (speedMultiplier)
 *   - Randomised attack hesitation (attackDelayUntil)
 *   - Lunge burst at attack start
 *   - Flanking behaviour: goblin circles to a side position, coils, then pounces
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

    // Flanking state.
    this.flankSide = Phaser.Math.Between(0, 1) === 0 ? 1 : -1; // 1=right, -1=left
    this.chaseMode = 'pursuing'; // 'pursuing' | 'coiling'
    this.coilUntil = 0;
  }

  // ── Goblin personality overrides ──

  /** Reset flank state on each return to idle so re-aggro picks a fresh side. */
  _onIdle() {
    this.chaseMode = 'pursuing';
    this.flankSide = Phaser.Math.Between(0, 1) === 0 ? 1 : -1;
    super._onIdle();
  }

  /** Reset chaseMode to pursuing when aggroed by a hit. */
  takeDamage(amount, type = 'physical', attackerX = null, guardDamage = 10) {
    const effective = super.takeDamage(amount, type, attackerX, guardDamage);
    if (this.state === 'chase') this.chaseMode = 'pursuing';
    return effective;
  }

  /**
   * Compute the world position the goblin is trying to reach —
   * a flanking spot 90° to one side of the player, at attack range + 20px.
   */
  _getFlankTarget(px, py) {
    const angleToSelf = Phaser.Math.Angle.Between(px, py, this.sprite.x, this.sprite.y);
    const flankAngle  = angleToSelf + (Math.PI / 2) * this.flankSide;
    const flankDist   = this.derivedStats.attackRange + 20;
    return {
      x: px + Math.cos(flankAngle) * flankDist,
      y: py + Math.sin(flankAngle) * flankDist,
    };
  }

  /** Chase with flanking: circle to a side position, coil, then pounce. */
  _onChase(px, py) {
    if (this.attackInProgress) return;

    const flankTarget = this._getFlankTarget(px, py);
    const distToFlank = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      flankTarget.x, flankTarget.y,
    );

    if (this.chaseMode === 'pursuing') {
      if (distToFlank < 25) {
        // Arrived at flank position — begin coil.
        this.chaseMode = 'coiling';
        this.coilUntil = this.scene.time.now + Phaser.Math.Between(400, 700);
        this.sprite.body.setVelocity(0, 0);
        const idleAnim = this.getIdleAnim();
        if (this.sprite.anims.currentAnim?.key !== idleAnim) {
          this.sprite.play(idleAnim);
        }
      } else {
        // Run toward flank target.
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y,
          flankTarget.x, flankTarget.y,
        );
        let vx = Math.cos(angle) * this.derivedStats.moveSpeed * 60;
        let vy = Math.sin(angle) * this.derivedStats.moveSpeed * 60;

        // Separation steering — nudge away from nearby goblins.
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

        vx *= this.speedMultiplier;
        vy *= this.speedMultiplier;

        this.sprite.body.setVelocity(vx, vy);

        const walkAnim = this._animKey(this.getDirectionAnim(angle));
        if (this.sprite.anims.currentAnim?.key !== walkAnim) {
          this.sprite.play(walkAnim);
        }
        this.sprite.flipX = false;
      }
    } else { // 'coiling'
      // If player drifted and flank point is now far — re-pursue.
      if (distToFlank > 40) {
        this.chaseMode = 'pursuing';
        return;
      }
      // Hold coil until timer expires, then pounce.
      if (this.scene.time.now >= this.coilUntil) {
        this.state = 'attack';
      }
    }
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
