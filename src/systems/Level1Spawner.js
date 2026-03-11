import levelClock   from './LevelClock';
import * as SpawnRing from './SpawnRing';
import EnemyRegistry from './EnemyRegistry';
import Goblin        from '../entities/Goblin';

const MAX_INTERVAL = 2.0;
const MIN_INTERVAL = 0.2;
const K  = 0.45;
const X0 = 12;
const MAX_ENEMIES = 500;

const MODIFIERS = {};   // empty — ready to populate per-minute tweaks

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function getBaseInterval(minute) {
  return MIN_INTERVAL + (MAX_INTERVAL - MIN_INTERVAL) / (1 + Math.exp(K * (minute - X0)));
}

function getFinalInterval(minute) {
  return clamp(getBaseInterval(minute) + (MODIFIERS[minute] ?? 0), MIN_INTERVAL, MAX_INTERVAL);
}

export default class Level1Spawner {
  constructor(scene, player) {
    this.scene    = scene;
    this.player   = player;
    this.registry = new EnemyRegistry();
    this._accum   = 0;
  }

  update(delta) {
    // delta from Phaser is milliseconds → convert to seconds
    const dt             = delta / 1000;
    const elapsedSeconds = levelClock.getElapsedSeconds();
    const minute         = Math.floor(elapsedSeconds / 60);
    const interval       = getFinalInterval(minute);

    this._accum += dt;
    if (this._accum < interval) return;

    this._accum = 0;

    if (this.registry.getAll().size >= MAX_ENEMIES) return;

    const { x, y } = SpawnRing.getSpawnPoint(this.player.sprite.x, this.player.sprite.y);
    const goblin    = new Goblin(this.scene, x, y);
    this.registry.register(goblin);
    this.scene.goblins.push(goblin);
  }
}
