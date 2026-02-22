export default class Shop {
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;

    const { width, height } = this.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.shopBtn = this.scene.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    this.shopPanel = this.scene.add.container(0, 0).setScrollFactor(0);

    const shopWindow = this.scene.add
      .rectangle(cx, cy, 1000, 500, 0x222222, 0.9)
      .setInteractive();

    const itemPreview = this.scene.add.rectangle(cx - 250, cy - 112, 450, 225, 0x333333);
    const itemDescBox = this.scene.add.rectangle(cx - 250, cy + 112, 450, 225, 0x2a2a2a);
    const itemDescText = this.scene.add.text(cx - 465, cy + 10, "Select an item...", {
      fontSize: "14px",
      color: "#aaaaaa",
      wordWrap: { width: 420 },
    });
    const itemGrid = this.scene.add.rectangle(cx + 250, cy, 450, 450, 0x222222);

    this.shopPanel.add([shopWindow, itemPreview, itemDescBox, itemDescText, itemGrid]);

    const cellSize = 100;
    const padding = 8;
    const gridLeft = cx + 250 - 200;
    const gridTop = cy - 200;

    this.items.forEach((item, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = gridLeft + col * cellSize + cellSize / 2;
      const y = gridTop + row * cellSize + cellSize / 2;
      const size = cellSize - padding;

      const cell = this.scene.add.rectangle(x, y, size, size, 0x444444);
      const border = this.scene.add.graphics();
      border.lineStyle(1, 0x888888, 1);
      border.strokeRect(x - size / 2, y - size / 2, size, size);

      this.shopPanel.add([cell, border]);
    });

    this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => {
      this.toggle();
    });
  }

  show() {
    this.shopPanel.setVisible(true);
  }

  hide() {
    this.shopPanel.setVisible(false);
  }

  toggle() {
    this.shopPanel.setVisible(!this.shopPanel.visible);
  }
}
