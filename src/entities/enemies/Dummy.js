import Enemy from './Enemy.js';
import { defaultEnemyStats } from '../../data/baseStats.js';
import { COLOR_DAMAGE_RED } from '../../config/constants.js';

export default class Dummy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, defaultEnemyStats);
    this.rect = scene.add.rectangle(x, y, 40, 60, COLOR_DAMAGE_RED);
    scene.physics.add.existing(this.rect, false);
    this.rect.body.setCollideWorldBounds(true);
    this.createHealthBar(x, y);

    this.state = 'idle';
    this.aggroRadius = 200;
    this.attackCooldown = false;
  }

  update() {
    if (this.state === 'dead') return;

    const { x: px, y: py } = this.scene.actions.getPlayerPosition();
    const dist = Phaser.Math.Distance.Between(
      this.rect.x, this.rect.y,
      px, py,
    );

    if (this.state === 'idle') {
      this.rect.body.setVelocity(0, 0);
      if (dist < this.aggroRadius) this.state = 'chase';
    } else if (this.state === 'chase') {
      if (dist > this.aggroRadius * 1.5) {
        this.state = 'idle';
        this.rect.body.setVelocity(0, 0);
      } else if (dist < this.derivedStats.attackRange) {
        this.rect.body.setVelocity(0, 0);
        if (!this.attackCooldown) {
          this.attackCooldown = true;
          this.currentArcType = 'stab';
          this.currentAttackRange = this.derivedStats.attackRange;
          const attackAngle = Phaser.Math.Angle.Between(this.rect.x, this.rect.y, px, py);
          this.scene.actions.damagePlayer(this.derivedStats.physicalDamage, this.rect.x);
          this.performAttack(attackAngle);
        }
      } else {
        const angle = Phaser.Math.Angle.Between(
          this.rect.x, this.rect.y,
          px, py,
        );
        let vx = Math.cos(angle) * this.derivedStats.moveSpeed * 60;
        let vy = Math.sin(angle) * this.derivedStats.moveSpeed * 60;

        // Separation steering — nudge away from nearby enemies when close.
        const SEPARATION = 60;
        for (const other of this.scene.enemies.getAll()) {
          if (other === this || other.state === 'dead') continue;
          const dx = this.rect.x - other.rect.x;
          const dy = this.rect.y - other.rect.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 0 && d < SEPARATION) {
            const strength = (SEPARATION - d) / SEPARATION;
            vx += (dx / d) * strength * this.derivedStats.moveSpeed * 60;
            vy += (dy / d) * strength * this.derivedStats.moveSpeed * 60;
          }
        }

        this.rect.body.setVelocity(vx, vy);
      }
      this.updateHealthBar();
    }
  }

  onAttackComplete() {
    this.attackCooldown = false;
  }

  onDeath() {
    this.state = 'dead';
    this.rect.body.setVelocity(0, 0);
    this.scene.enemies.unregister(this);
    this.scene.tweens.add({
      targets:    this.rect,
      alpha:      0,
      duration:   400,
      onComplete: () => {
        this.rect.destroy();
        this.healthBar.destroy();
        this.hpLabel.destroy();
      },
    });
  }
}
