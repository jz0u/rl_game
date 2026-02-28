import Entity from '../Entity.js';
import { COLOR_HP_BAR_BG, COLOR_DAMAGE_RED } from '../../config/constants.js';

const BAR_WIDTH  = 40;
const BAR_HEIGHT = 5;
const BAR_Y_OFFSET = -35;

export default class Enemy extends Entity {
  constructor(scene, x, y, baseStats) {
    super(scene, baseStats);
  }

  // Call from subclass constructor AFTER the visual (this.rect / this.sprite) is created.
  createHealthBar(x, y) {
    this.healthBar = this.scene.add.graphics();
    this.hpLabel = this.scene.add.text(x, y - 45, '', {
      fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.updateHealthBar();
  }

  updateHealthBar() {
    const anchor = this.rect ?? this.sprite;
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

  takeDamage(amount, type = 'physical', attackerX = null) {
    const effective = super.takeDamage(amount, type);
    this.updateHealthBar();
    this.showDamageNumber(effective);

    this._applyHitReaction(this.rect ?? this.sprite, attackerX);
    return effective;
  }

  showDamageNumber(amount) {
    const anchor = this.rect ?? this.sprite;
    const ax = anchor?.x ?? 0;
    const ay = anchor?.y ?? 0;

    const text = this.scene.add.text(ax, ay - 20, String(amount), {
      fontSize: '12px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 1);

    this.scene.tweens.add({
      targets:  text,
      y:        ay - 60,
      alpha:    0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  onDeath() {
    const anchor = this.rect ?? this.sprite;
    if (!anchor) {
      this._resetAfterDeath();
      return;
    }
    this.scene.tweens.add({
      targets:    anchor,
      alpha:      0.2,
      duration:   150,
      yoyo:       true,
      onComplete: () => {
        anchor.setAlpha(1);
        this._resetAfterDeath();
      },
    });
  }

  _resetAfterDeath() {
    this.currentHp = this.derivedStats.maxHP;
    this.updateHealthBar();
  }
}
