import Character from './Character.js';

/**
 * EnemyAI — base class for all AI-controlled enemies.
 *
 * Sits between Character and specific enemy classes (e.g. Goblin).
 * Provides the shared 4-state machine (idle → chase → attack → dead),
 * last-known-position tracking, hit-aggro, and default behaviour hooks
 * that subclasses can override.
 *
 * Subclasses must:
 *   1. Create this.sprite and call this._registerAnimComplete().
 *   2. Set this.targets = () => [...].
 *   3. Implement onDeath() for enemy-specific death handling.
 *   4. Optionally override _onIdle(), _onChase(), _onAttack().
 */
export default class EnemyAI extends Character {
  constructor(scene, x, y, baseStats, animPrefix) {
    super(scene, x, y, baseStats, animPrefix, false);

    this.state             = 'idle';
    this.lastKnownPosition = null;
    this.playerVisible     = false;
  }

  // ── Shared enemy combat ──

  takeDamage(amount, type = 'physical', attackerX = null, guardDamage = 10) {
    const effective = super.takeDamage(amount, type, attackerX, guardDamage);
    this.updateHealthBar();
    this.showDamageNumber(effective);
    if (this.state === 'idle') this.state = 'chase';
    return effective;
  }

  // ── AI state machine ──

  update() {
    this.updateHealthBar();

    if (this.state === 'dead') return;

    const { x: px, y: py } = this.scene.actions.getKnightPosition();
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, px, py);

    switch (this.state) {
      case 'idle':
        this._onIdle();
        if (dist < this.derivedStats.visionRadius) this.state = 'chase';
        break;

      case 'chase':
        if (dist < this.derivedStats.visionRadius) {
          this.playerVisible     = true;
          this.lastKnownPosition = { x: px, y: py };
          if (dist < this.derivedStats.attackRange) {
            this.state = 'attack';
            this.sprite.body.setVelocity(0, 0);
          } else {
            this._onChase(px, py);
          }
        } else {
          this.playerVisible = false;
          if (this.lastKnownPosition) {
            const distToLKP = Phaser.Math.Distance.Between(
              this.sprite.x, this.sprite.y,
              this.lastKnownPosition.x, this.lastKnownPosition.y,
            );
            if (distToLKP < 10) {
              this.state             = 'idle';
              this.lastKnownPosition = null;
              this._onIdle();
            } else {
              this._onChase(this.lastKnownPosition.x, this.lastKnownPosition.y);
            }
          } else {
            this.state = 'idle';
            this._onIdle();
          }
        }
        break;

      case 'attack':
        if (dist > this.derivedStats.attackRange) {
          this.state = 'chase';
        } else if (!this.attackInProgress) {
          this._onAttack(px, py);
        }
        break;

      case 'dead':
        break;
    }
  }

  // ── Overridable behaviour hooks ──

  /** Stand still and play the idle animation for the current facing direction. */
  _onIdle() {
    if (!this.attackInProgress) {
      this.sprite.body.setVelocity(0, 0);
      const idleAnim = this.getIdleAnim();
      if (this.sprite.anims.currentAnim?.key !== idleAnim) {
        this.sprite.play(idleAnim);
      }
    }
  }

  /**
   * Move toward the target position (tx, ty) with separation steering.
   * Uses this.scene.enemies if available, otherwise falls back to this.scene.goblins.
   */
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

    this.sprite.body.setVelocity(vx, vy);

    const walkAnim = this._animKey(this.getDirectionAnim(angle));
    if (this.sprite.anims.currentAnim?.key !== walkAnim) {
      this.sprite.play(walkAnim);
    }
    this.sprite.flipX = false;
  }

  /** Perform a melee swing toward the player. */
  _onAttack(px, py) {
    if (this.scene.time.now < this.staggerUntil) return;
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, px, py);
    this.attack(angle);
  }
}
