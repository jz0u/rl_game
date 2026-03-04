import EnemyAI from './EnemyAI.js';
import { goblinBaseStats } from '../data/baseStats.js';
import CoinDrop from './CoinDrop.js';

/**
 * Goblin — a basic melee enemy.
 *
 * All AI logic (state machine, chase, attack, takeDamage) lives in EnemyAI.
 * This class only sets up the sprite and defines what happens on death.
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
