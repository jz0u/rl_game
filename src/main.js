import Phaser from "phaser";
import Player from "./Player";
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
    allItems.forEach(item => {
      this.load.image(item.id, item.paperdollPath);
  });
  }

  create() {
    this._createShopUI();
    this._createPlayer();
    this._createInput();
  }

  // ── Shop UI ──

  _createShopUI() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Toggle button (fixed to screen)
    this.shopBtn = this.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    // Panel container (fixed to screen)
    this.shopPanel = this.add.container(0, 0).setScrollFactor(0);

    const shopWindow = this.add
      .rectangle(cx, cy, 1000, 500, 0x222222, 0.9)
      .setInteractive();

    const itemPreview = this.add.rectangle(cx - 250, cy - 112, 450, 225, 0x333333);
    const itemDescBox = this.add.rectangle(cx - 250, cy + 112, 450, 225, 0x2a2a2a);
    const itemDescText = this.add.text(cx - 465, cy + 10, "Select an item...", {
      fontSize: "14px",
      color: "#aaaaaa",
      wordWrap: { width: 420 },
    });
    const itemGrid = this.add.rectangle(cx + 250, cy, 450, 450, 0x222222);

    this.shopPanel.add([shopWindow, itemPreview, itemDescBox, itemDescText, itemGrid]);

    // 4x4 item grid cells
    const cellSize = 100;
    const padding = 8;
    const gridLeft = cx + 250 - 200;
    const gridTop = cy - 200;

    allItems.forEach((item, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = gridLeft + col * cellSize + cellSize / 2;
  const y = gridTop + row * cellSize + cellSize / 2;
  const size = cellSize - padding;

  const cell = this.add.rectangle(x, y, size, size, 0x444444);
  const border = this.add.graphics();
  border.lineStyle(1, 0x888888, 1);
  border.strokeRect(x - size / 2, y - size / 2, size, size);
 
  this.shopPanel.add([cell, border]);
});


    this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => {
      this.shopPanel.setVisible(!this.shopPanel.visible);
    });
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

    this.input.on("pointerdown", (pointer) => {
      if (this.shopPanel.visible) return;

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
