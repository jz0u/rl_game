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
    // Grid & panel layout constants — edit these to
    // resize or reposition the item grid.
    // ══════════════════════════════════════════════════
    const COLS          = 4;
    const ROWS          = 4;
    const CELL_SIZE     = 100;
    const CELL_PAD      = 8;
    const GRID_WIDTH    = 450;
    const GRID_HEIGHT   = 450;
    const GRID_CENTER_X = cx + 250;
    const GRID_CENTER_Y = cy;

    this.cols     = COLS;
    this.rows     = ROWS;
    this.cellSize = CELL_SIZE;
    this.padding  = CELL_PAD;
    this.gridLeft = GRID_CENTER_X - (COLS * CELL_SIZE) / 2;
    this.gridTop  = GRID_CENTER_Y - (ROWS * CELL_SIZE) / 2;

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

    const shopWindow = this.scene.add.image(cx, cy, 'shop_panel')
      .setDisplaySize(1200, 800)
      .setInteractive();
      

    const itemPreview = this.scene.add.rectangle(cx - 250, cy - 112, 450, 225, 0x333333);
    const itemDescBox = this.scene.add.rectangle(cx - 250, cy + 112, 450, 225, 0x2a2a2a);

    this.previewBase = this.scene.add.image(cx - 250, cy - 112, 'player_paperdoll');
    this.previewBase.setDisplaySize(225, 225);

    this.previewImage = this.scene.add.image(cx - 250, cy - 112, '').setVisible(false);
    this.previewImage.setDisplaySize(225, 225);

    this.itemDescText = this.scene.add.text(cx - 465, cy + 10, "Select an item...", {
      fontSize: "14px",
      color: "#aaaaaa",
      wordWrap: { width: 420 },
    });

    const itemGrid = this.scene.add.rectangle(GRID_CENTER_X, GRID_CENTER_Y, GRID_WIDTH, GRID_HEIGHT, 0x222222);

    this.shopPanel.add([shopWindow, itemPreview, itemDescBox, this.previewBase, this.previewImage, this.itemDescText, itemGrid]);

    // ── Pagination buttons ──
    this.prevBtn = this.scene.add
      .text(cx + 50, cy + 240, "< PREV", {
        fontSize: "14px",
        backgroundColor: "#444",
        padding: { x: 8, y: 4 },
        color: "#fff",
      })
      .setInteractive();

    this.nextBtn = this.scene.add
      .text(cx + 350, cy + 240, "NEXT >", {
        fontSize: "14px",
        backgroundColor: "#444",
        padding: { x: 8, y: 4 },
        color: "#fff",
      })
      .setInteractive();

    this.pageLabel = this.scene.add.text(cx + 200, cy + 240, "", {
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
      const y = this.gridTop + row * this.cellSize + this.cellSize / 2;
      const size = this.cellSize - this.padding;
  
      const cell = this.scene.add.rectangle(x, y, size, size, 0x444444)
        .setInteractive();
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
    this.previewImage.setDisplaySize(225, 225);
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