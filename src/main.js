/**
 * main.js — Game entry point.
 *
 * Bootstraps Phaser and defines GameScene, the single scene that hosts
 * the player, shop UI, and input routing.
 *
 * Scene lifecycle:
 *   preload() → loads all textures/spritesheets
 *   create()  → builds player, UI, and input handlers
 *   update()  → called every frame; delegates to Player.update()
 */
import Phaser from "phaser";
import { Armory } from "./Armory";
import { DEVTEST_INVENTORY } from "./DEVTEST";
import { loadAssets } from "./pipelines/loadAssets";
import { createGameObjects } from "./pipelines/createGameObjects";
import { setupInput } from "./pipelines/input";

/** Flat array of every item across all equipment slots. */
const allItems = Object.values(Armory).flat();

/** Logical canvas dimensions — used by UI elements to position themselves. */
export const GAME_WINDOW_WIDTH = 1280;
export const GAME_WINDOW_HEIGHT = 720;
export const GAME_WINDOW_CENTER = { X: GAME_WINDOW_WIDTH / 2, Y: GAME_WINDOW_HEIGHT / 2 };


class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  /** Delegates all asset loading to the load pipeline. */
  preload() {
    loadAssets(this);
  }

  /** Instantiates game objects, wires input, and runs dev tests if present. */
  create() {
    createGameObjects(this, allItems);
    setupInput(this);
    //DEVTEST_INVENTORY(this.inventory); // DEV ONLY
  }

  /** Called every frame by Phaser. */
  update() {
    this.player.update();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WINDOW_WIDTH,
  height: GAME_WINDOW_HEIGHT,
  backgroundColor: "#fff999",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } },
  },
  scene: [GameScene],
});
