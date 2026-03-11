import levelClock from './LevelClock';

const levels = [
  { sceneKey: 'MainMenuScene', winCondition: 'Click PLAY',         clock: null },
  { sceneKey: 'Level1Scene',   winCondition: 'Defeat all enemies', clock: { start: 'scene:ready', end: 'scene:shutdown' } },
];

class LevelManager {
  constructor() {
    this.game         = null;
    this.currentIndex = 0;
  }

  init(game) {
    this.game = game;
  }

  _startClockForScene(sceneKey, clockConfig) {
    const scene = this.game.scene.getScene(sceneKey);
    scene.events.once(clockConfig.start, () => levelClock.start());
    scene.events.once(clockConfig.end,   () => {
      levelClock.stop();
      levelClock.reset();
    });
  }

  advance() {
    const currentNode = levels[this.currentIndex];
    if (currentNode.clock) { levelClock.stop(); levelClock.reset(); }
    this.currentIndex++;
    if (this.currentIndex >= levels.length) return;
    const nextNode = levels[this.currentIndex];

    this.game.scene.stop(currentNode.sceneKey);
    this.game.scene.start(nextNode.sceneKey);

    if (nextNode.clock) {
      this._startClockForScene(nextNode.sceneKey, nextNode.clock);
    }
  }
}

export default new LevelManager();
