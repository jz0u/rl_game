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
import { validateArmory } from "./data/validateArmory";
import { loadAssets } from "./scene/loadAssets";
import { createGameObjects } from "./scene/createGameObjects";
import { setupInput } from "./input/input";
import { setupKeybinds } from "./input/keybinds";

/** Flat array of every item across all equipment slots. */
const allItems = Object.values(Armory).flat();

if (import.meta.env.DEV) {
  const violations = validateArmory(Armory);
  if (violations === 0) console.log('[Armory] All items valid.');
}

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
    if (this.dummy)  this.dummy.update(this.player);
    if (this.dummy2) this.dummy2.update(this.player);
    this.hud?.update();
    this.cursorUI.update();
    this.cameras.main.setScroll(
      Math.round(this.cameras.main.scrollX),
      Math.round(this.cameras.main.scrollY),
    );
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:  GAME_WINDOW_WIDTH,
    height: GAME_WINDOW_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } },
  },
  scene: [GameScene],
});
