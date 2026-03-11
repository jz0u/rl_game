const levels = [
  { sceneKey: 'MainMenuScene', winCondition: 'Click PLAY' },
  { sceneKey: 'Level1Scene',   winCondition: 'Defeat all enemies' },
];

class LevelManager {
  constructor() {
    this.game = null;
    this.currentIndex = 0;
  }

  init(game) {
    this.game = game;
  }

  advance() {
    const currentKey = levels[this.currentIndex].sceneKey;
    this.currentIndex++;
    if (this.currentIndex >= levels.length) return;
    const nextKey = levels[this.currentIndex].sceneKey;
    this.game.scene.stop(currentKey);
    this.game.scene.start(nextKey);
  }
}

export default new LevelManager();
