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
import Player from "./Player";
import Shop from "./Shop";
import Inventory from "./Inventory";
import { Armory } from "./Armory";

/** Flat array of every item across all equipment slots. */
const allItems = Object.values(Armory).flat();

/** World-space coordinates where the player spawns. */
const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

/** Logical canvas dimensions — used by UI elements to position themselves. */
export const GAME_WINDOW_WIDTH = 1280;
export const GAME_WINDOW_HEIGHT = 720;
export const GAME_WINDOW_CENTER = { X: GAME_WINDOW_WIDTH / 2, Y: GAME_WINDOW_HEIGHT / 2 };


class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Loads all assets before the scene starts.
   * Each item gets two textures: a cropped shop icon (item.id) and a
   * full-body paperdoll used in the preview panel (item.id + '_full').
   */
  preload() {
    Player.preload(this);
    this.load.image('player_paperdoll', 'assets/icons/uncropped/Medieval_Warfare_Male_1_Paperdoll.png');
    allItems.forEach(item => {
      this.load.image(item.id, item.paperdollPath);
      this.load.image(item.id + '_full', item.paperdollPathFull);
    });
    this.load.image('shop_panel', 'assets/ui/shop_panel.png');
    this.load.image('inventory_panel', 'assets/ui/shop_panel.png');

    this.load.image('prev_btn', 'assets/ui/shop_arrow_left.png');
    this.load.image('next_btn', 'assets/ui/shop_arrow_right.png');
  }

  create() {
    this._createShopUI();
    this._createPlayer();
    this._createInput();
    this._createInventoryUI();
  }
  // inventory
  _createInventoryUI(){
    this.inventory = new Inventory(this);
  }

  // ── Shop ──

  /** Instantiates the Shop UI with the full item catalogue. */
  _createShopUI() {
    this.shop = new Shop(this, allItems);
  }

  // ── Player ──

  /** Spawns the player sprite and registers all base animations. */
  _createPlayer() {
    this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(this);
  }

  // ── Input ──

  /**
   * Sets up global pointer input.
   * Clicks are ignored when the pointer is over a UI object or a panel is open.
   *   Right-click → move player to cursor position.
   *   Left-click  → trigger attack toward cursor.
   */
  _createInput() {
    this.input.mouse.disableContextMenu();

    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (currentlyOver.length > 0) return;
      if (this.shop.shopPanel.visible) return;

      if (pointer.rightButtonDown()) {
        this.player.moveTo(pointer.x, pointer.y);
      } else if (pointer.leftButtonDown()) {
        this.player.attack(pointer.x);
      }
    });
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
