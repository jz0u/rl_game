import Enemy from './Enemy.js';
import { defaultEnemyStats } from '../../data/baseStats.js';

export default class Dummy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, defaultEnemyStats);
    this.rect = scene.add.rectangle(x, y, 40, 60, 0xff2222);
    scene.physics.add.existing(this.rect, true);
    this.createHealthBar(x, y);
  }
}
