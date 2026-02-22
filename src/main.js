import Phaser from "phaser";
import Player from "./Player";
import Shop from "./Shop";
import Inventory from "./Inventory";
import { Armory } from "./Armory";
const allItems = Object.values(Armory).flat();

const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    Player.preload(this);
    this.load.image('player_paperdoll', 'assets/icons/uncropped/Medieval_Warfare_Male_1_Paperdoll.png');
    allItems.forEach(item => {
      this.load.image(item.id, item.paperdollPath);
      this.load.image(item.id + '_full', item.paperdollPathFull);
  });
  this.load.image('shop_panel', 'assets/ui/Game Menu/1x/Asset 1.2 - 1080p.png');
  }

  create() {
    this._createShopUI();
    this._createPlayer();
    this._createInput();
  }

  _createShopUI() {
    this.shop = new Shop(this, allItems);
    this.inventory = new Inventory(this);

    this.shop.shopBtn.on("pointerdown", () => this.inventory.hide());
    this.inventory.inventoryBtn.on("pointerdown", () => this.shop.hide());
  }

  // ── Player ──

  _createPlayer() {
    this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(this);
    this.player.equip({ slot: "weapon", animPrefix: "longsword" });
  }

  // ── Input ──

  _createInput() {
    this.input.mouse.disableContextMenu();

    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (currentlyOver.length > 0) return;
      if (this.shop.shopPanel.visible || this.inventory.panel.visible) return;

      if (pointer.rightButtonDown()) {
        this.player.moveTo(pointer.x, pointer.y);
      } else if (pointer.leftButtonDown()) {
        this.player.attack(pointer.x);
      }
    });
  }

  update() {
    this.player.update();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
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
