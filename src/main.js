import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT } from './config/constants';

new Phaser.Game({
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
  scene: [GameScene],
});
