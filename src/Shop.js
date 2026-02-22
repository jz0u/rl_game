export default class Shop {
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;
    this.currentPage = 0;
    this.gridCells = [];

    const { width, height } = this.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    // ══════════════════════════════════════════════════
    // Window dimensions — change these and everything
    // else moves with it automatically
    // ══════════════════════════════════════════════════
    const WIN_W   = 1080;
    const WIN_H   = 600;
    const PADDING = 20;

    // ── Window edges ──
    const winLeft   = cx - WIN_W / 2;  // 640 - 540 = 100
    const winRight  = cx + WIN_W / 2;  // 640 + 540 = 1180
    const winTop    = cy - WIN_H / 2;  // 360 - 300 = 60
    const winBottom = cy + WIN_H / 2;  // 360 + 300 = 660

    // ── 50/50 column split ──
    const colWidth     = WIN_W / 2;                          // 540
    const leftCenterX  = winLeft + colWidth / 2;             // 100 + 270 = 370
    const rightCenterX = winLeft + colWidth + colWidth / 2;  // 100 + 540 + 270 = 910

    // ── Item grid constants ──
    const COLS      = 4;
    const ROWS      = 4;
    const CELL_SIZE = 100;
    const CELL_PAD  = 8;

    this.cols     = COLS;
    this.rows     = ROWS;
    this.cellSize = CELL_SIZE;
    this.padding  = CELL_PAD;

    // Grid top-left corner, derived from rightCenterX
    const gridW = COLS * CELL_SIZE;  // 400
    const gridH = ROWS * CELL_SIZE;  // 400
    this.gridLeft = rightCenterX - gridW / 2;
    this.gridTop  = cy - gridH / 2;

    // ── Toggle button ──
    this.shopBtn = this.scene.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── Shop panel container ──
    this.shopPanel = this.scene.add.container(0, 0).setScrollFactor(0);

    // Background window image
    const shopWindow = this.scene.add.image(cx, cy, 'shop_panel')
      .setDisplaySize(WIN_W, WIN_H)
      .setInteractive();

    // ── Left panel: preview image on top, description below ──
    const previewH = WIN_H * 0.55;  // 55% of window height
    const descH    = WIN_H * 0.25;  // 25% of window height
    const previewY = winTop + PADDING + previewH / 2;
    const descY    = previewY + previewH / 2 + PADDING + descH / 2;

    const itemPreview = this.scene.add.rectangle(leftCenterX, previewY, colWidth - PADDING * 2, previewH, 0x333333);
    const itemDescBox = this.scene.add.rectangle(leftCenterX, descY,    colWidth - PADDING * 2, descH,    0x2a2a2a);

    this.previewBase = this.scene.add.image(leftCenterX, previewY, 'player_paperdoll');
    this.previewBase.setDisplaySize(previewH * 0.8, previewH * 0.8);

    this.previewImage = this.scene.add.image(leftCenterX, previewY, '').setVisible(false);
    this.previewImage.setDisplaySize(previewH * 0.8, previewH * 0.8);

    this.itemDescText = this.scene.add.text(
      leftCenterX - (colWidth - PADDING * 2) / 2 + PADDING,
      descY - descH / 2 + PADDING,
      "Select an item...",
      { fontSize: "14px", color: "#aaaaaa", wordWrap: { width: colWidth - PADDING * 4 } }
    );

    // ── Right panel: item grid ──
    const itemGrid = this.scene.add.rectangle(rightCenterX, cy, colWidth - PADDING * 2, gridH + PADDING, 0x222222);

    this.shopPanel.add([shopWindow, itemPreview, itemDescBox, this.previewBase, this.previewImage, this.itemDescText, itemGrid]);

    // ── Pagination buttons — anchored to window bottom ──
    const paginationY = winBottom - PADDING - 10;

    this.prevBtn = this.scene.add
      .text(rightCenterX - 150, paginationY, "< PREV", {
        fontSize: "14px",
        backgroundColor: "#444",
        padding: { x: 8, y: 4 },
        color: "#fff",
      })
      .setInteractive();

    this.nextBtn = this.scene.add
      .text(rightCenterX + 80, paginationY, "NEXT >", {
        fontSize: "14px",
        backgroundColor: "#444",
        padding: { x: 8, y: 4 },
        color: "#fff",
      })
      .setInteractive();

    this.pageLabel = this.scene.add.text(rightCenterX - 20, paginationY, "", {
      fontSize: "14px",
      color: "#aaaaaa",
    });

    this.shopPanel.add([this.prevBtn, this.nextBtn, this.pageLabel]);

    this.prevBtn.on("pointerdown", () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this._renderPage();
      }
    });

    this.nextBtn.on("pointerdown", () => {
      const totalPages = Math.ceil(this.items.length / (this.cols * this.rows));
      if (this.currentPage < totalPages - 1) {
        this.currentPage++;
        this._renderPage();
      }
    });

    // ── Initial render ──
    this._renderPage();

    this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
  }

  // ── Pagination ──

  _renderPage() {
    this.gridCells.forEach(obj => obj.destroy());
    this.gridCells = [];

    const perPage = this.cols * this.rows;
    const start = this.currentPage * perPage;
    const pageItems = this.items.slice(start, start + perPage);

    const totalPages = Math.ceil(this.items.length / perPage);
    this.pageLabel.setText(`${this.currentPage + 1} / ${totalPages}`);

    pageItems.forEach((item, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const x = this.gridLeft + col * this.cellSize + this.cellSize / 2;
      const y = this.gridTop  + row * this.cellSize + this.cellSize / 2;
      const size = this.cellSize - this.padding;

      const cell = this.scene.add.rectangle(x, y, size, size, 0x444444).setInteractive();
      cell.on('pointerdown', () => this._selectItem(item));
      const icon = this.scene.add.image(x, y, item.id);
      icon.setDisplaySize(size, size);
      const border = this.scene.add.graphics();
      border.lineStyle(1, 0x888888, 1);
      border.strokeRect(x - size / 2, y - size / 2, size, size);

      this.shopPanel.add([cell, icon, border]);
      this.gridCells.push(cell, icon, border);
    });
  }

  _selectItem(item) {
    this.previewImage.setTexture(item.id + '_full');
    this.previewImage.setVisible(true);

    const lines = [item.displayName || item.id];
    if (item.slot) lines.push(`Slot: ${item.slot}`);
    if (item.type) lines.push(`Type: ${item.type}`);
    if (item.stats) {
      Object.entries(item.stats).forEach(([stat, val]) => {
        lines.push(`${stat}: ${val}`);
      });
    }
    this.itemDescText.setText(lines.join('\n'));
  }

  // ── Visibility ──

  show() { this.shopPanel.setVisible(true); }
  hide() {
    this.previewImage.setVisible(false);
    this.itemDescText.setText('Select an item...');
    this.shopPanel.setVisible(false);
  }

  toggle() {
    if (this.shopPanel.visible) {
      this.hide();
    } else {
      this.shopPanel.setVisible(true);
    }
  }
}