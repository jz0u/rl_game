import Enemy from './Enemy.js';
import { defaultEnemyStats } from '../../data/baseStats.js';

export default class Dummy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, defaultEnemyStats);
    this.rect = scene.add.rectangle(x, y, 40, 60, 0xff2222);
    scene.physics.add.existing(this.rect, false);
    this.rect.body.setCollideWorldBounds(true);
    this.createHealthBar(x, y);

    this.state = 'idle';
    this.aggroRadius = 200;
    this.moveSpeed = 60;
    this.attackRange = 40;
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
      } else if (dist < this.attackRange) {
        this.rect.body.setVelocity(0, 0);
        if (!this.attackCooldown) {
          this.attackCooldown = true;
          this.scene.actions.damagePlayer(this.derivedStats.physicalDamage);
          this.rect.setFillStyle(0xffffff);
          this.scene.time.delayedCall(80, () => this.rect.setFillStyle(0xff2222));
          this.scene.time.delayedCall(this.derivedStats.attackSpeed, () => {
            this.attackCooldown = false;
          });
        }
      } else {
        const angle = Phaser.Math.Angle.Between(
          this.rect.x, this.rect.y,
          px, py,
        );
        this.rect.body.setVelocity(
          Math.cos(angle) * this.moveSpeed,
          Math.sin(angle) * this.moveSpeed,
        );
      }
      this.updateHealthBar();
    }
  }

  onDeath() {
    this.state = 'dead';
    this.rect.body.setVelocity(0, 0);
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
