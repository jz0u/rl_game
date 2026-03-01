export default class EnemyRegistry {
  constructor() { this._enemies = new Set(); }
  register(enemy)   { this._enemies.add(enemy); }
  unregister(enemy) { this._enemies.delete(enemy); }
  getAll()          { return this._enemies; }
  getLiving()       { return [...this._enemies].filter(e => !e.isDead()); }
}
