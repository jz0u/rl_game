import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import MainMenuScene from "./scenes/MainMenuScene";
import levelManager from "./systems/LevelManager";
import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT } from './config/constants';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WINDOW_WIDTH,
    height: GAME_WINDOW_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } },
  },
  scene: [MainMenuScene, GameScene],
});

levelManager.init(game);
