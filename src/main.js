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
import { Armory } from "./data/Armory";
import { loadAssets } from "./pipelines/loadAssets";
import { createGameObjects } from "./pipelines/createGameObjects";
import { setupInput } from "./pipelines/input";
import { setupKeybinds } from "./pipelines/keybinds";

/** Flat array of every item across all equipment slots. */
const allItems = Object.values(Armory).flat();

import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT } from './config/constants';

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
    setupKeybinds(this);
  }

  /** Called every frame by Phaser. */
  update() {
    this.player.update();
    this.cameras.main.setScroll(
      Math.round(this.cameras.main.scrollX),
      Math.round(this.cameras.main.scrollY),
    );
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WINDOW_WIDTH,
  height: GAME_WINDOW_HEIGHT,
  backgroundColor: "#000000",
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
