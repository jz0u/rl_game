import { computeGearStats }    from '../data/gearStats.js';
import { computeDerivedStats } from '../systems/StatEngine.js';

export default class Entity {
  constructor(scene, baseStats) {
    this.scene     = scene;
    this.baseStats = baseStats;
    this.recomputeStats(new Map());
  }

  recomputeStats(equippedMap) {
    const gearStats     = computeGearStats(equippedMap);
    this.derivedStats   = computeDerivedStats(this.baseStats, gearStats);
    this.currentHp      = this.derivedStats.maxHP;
    this.currentStamina = this.derivedStats.maxStamina;
  }

  takeDamage(amount, type = 'physical') {
    const resist    = type === 'magical'
      ? this.derivedStats.magicalResist
      : this.derivedStats.physicalResist;
    const effective = Math.max(1, amount - resist);
    this.currentHp  = Math.max(0, this.currentHp - effective);
    if (this.isDead()) this.onDeath();
    return effective;
  }

  heal(amount) {
    this.currentHp = Math.min(this.currentHp + amount, this.derivedStats.maxHP);
  }

  isDead() {
    return this.currentHp <= 0;
  }

  onDeath() {}
}
