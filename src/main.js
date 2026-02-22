import Phaser from "phaser";
import Player from "./Player";

const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    Player.preload(this);
  }

  create() {
    // ── ITEMS BUTTON ──
    const btn = this.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── SHOP PANEL ──
    const shopPanel = this.add.container(0, 0).setScrollFactor(0);

    // outer window
    const shopWindow = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, 1000, 500, 0x222222, 0.9)
      .setInteractive();

    // left pane — top half (item image)
    const itemPreview = this.add.rectangle(
      this.scale.width / 2 - 250,
      this.scale.height / 2 - 112,
      450, 225, 0x333333, 1,
    );

    // left pane — bottom half (item description)
    const itemPreviewTextbox = this.add.rectangle(
      this.scale.width / 2 - 250,
      this.scale.height / 2 + 112,
      450, 225, 0x2a2a2a, 1,
    );

    // placeholder text inside the textbox
    const itemPreviewText = this.add.text(
      this.scale.width / 2 - 465,
      this.scale.height / 2 + 10,
      "Select an item...",
      { fontSize: "14px", color: "#aaaaaa", wordWrap: { width: 420 } }
    );

    // right pane — item grid background
    const itemGrid = this.add.rectangle(
      this.scale.width / 2 + 250,
      this.scale.height / 2,
      450, 450, 0x222222, 1,
    );

    // backgrounds first so cells draw on top
    shopPanel.add([shopWindow, itemPreview, itemPreviewTextbox, itemPreviewText, itemGrid]);

    // ── ITEM GRID CELLS ──
    const cellSize = 100;
    const padding = 8;
    const gridLeft = this.scale.width / 2 + 250 - 200;
    const gridTop = this.scale.height / 2 - 200;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = gridLeft + col * cellSize + cellSize / 2;
        const y = gridTop + row * cellSize + cellSize / 2;
        const cell = this.add.rectangle(x, y, cellSize - padding, cellSize - padding, 0x444444);
        const border = this.add.graphics();
        border.lineStyle(1, 0x888888, 1);
        border.strokeRect(
          x - (cellSize - padding) / 2,
          y - (cellSize - padding) / 2,
          cellSize - padding,
          cellSize - padding,
        );
        shopPanel.add(cell);
        shopPanel.add(border);
      }
    }

    shopPanel.setVisible(false);
    shopPanel.setDepth(10);

    btn.on("pointerdown", () => {
      shopPanel.setVisible(!shopPanel.visible);
    });

    // ── PLAYER ──
    this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(this);
    this.player.equip({ slot: "weapon", animPrefix: "longsword" });

    this.input.mouse.disableContextMenu();

    // ── INPUT ──
    this.input.on("pointerdown", (pointer) => {
      if (shopPanel.visible) return;
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