import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";

const CELL_SIZE = 100; // pixel size of each grid slot in the item list
const ICON_SIZE = 75;  // display size of the item icon within each slot
/** Shop panel occupies 75% of the window on each axis. */
const PANEL_SCALE = 0.75;
/** Width and height of the prev/next navigation arrow buttons. */
const NAV_BTN_WIDTH = 46;
const NAV_BTN_HEIGHT = 167;

/**
 * Shop — the in-game item browsing UI.
 *
 * Layout: the panel occupies 75% of the window.
 *   Left quarter  → paperdoll preview + item stats text.
 *   Right half    → paginated grid of item icons.
 *
 * Clicking an icon calls _renderPreview() to update the left panel.
 * The panel is toggled via the "ITEMS" button (shopBtn).
 */
export default class Shop {
  /**
   * Builds and adds all Shop UI elements to the scene.
   * The panel starts visible; call hide() to open closed.
   * @param {Phaser.Scene} scene
   * @param {object[]} items - Full item catalogue from Armory (all slots combined).
   */
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;
    this.currentPage = 0;
    /** Icons currently rendered on this page; destroyed and rebuilt on page change. */
    this.onPage = [];
    this.shopWindowWidth = GAME_WINDOW_WIDTH * PANEL_SCALE;
    this.shopWindowHeight = GAME_WINDOW_HEIGHT * PANEL_SCALE;

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

    this._buildPreviewPane();
    this._buildNavButtons();
    this._renderPage(0);

    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
    this.hide();
  }

  /**
   * Creates the paperdoll image, item overlay, and stat text objects,
   * then adds them to the shop panel container.
   */
  _buildPreviewPane() {
    const shopWindow = this.scene.add.image(GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'shop_panel')
      .setDisplaySize(this.shopWindowWidth + 100, this.shopWindowHeight + 10)
      .setAlpha(0.8)
      .setInteractive();

    const dollSize = Math.min(this.shopWindowWidth / 2, this.shopWindowHeight);
    const dollX = GAME_WINDOW_CENTER.X - this.shopWindowWidth / 2 + this.shopWindowWidth / 4; // 400 = rect 2 center

    this.playerDoll = this.scene.add.image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(dollSize, dollSize)
      .setAlpha(1)
      .setInteractive(); // TODO: wire up pointer events or remove .setInteractive()

    this.itemOverlay = this.scene.add.image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(dollSize, dollSize)
      .setVisible(false);

    this.shopPanel.add([shopWindow, this.playerDoll, this.itemOverlay]);

    const leftX = GAME_WINDOW_CENTER.X - this.shopWindowWidth / 2; // 160
    const topY = GAME_WINDOW_CENTER.Y - this.shopWindowHeight / 2; // 90
    const paneW = this.shopWindowWidth / 2;  // 480
    const paneH = this.shopWindowHeight;     // 540
    const rectW = paneW / 3;                 // 160

    for (let i = 0; i < 3; i++) {
      const rect = this.scene.add.graphics();
      rect.fillStyle(0x1a1a1a, 0.5);
      rect.fillRect(leftX + i * rectW, topY, rectW, paneH);
      rect.lineStyle(1, 0x8B6914, 0.8);
      rect.strokeRect(leftX + i * rectW, topY, rectW, paneH);
      this.shopPanel.add(rect);
    }

    this.generalText = this.scene.add.text(
      leftX + 10,
      topY + 10,
      '',
      { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#ffffff',
        wordWrap: { width: rectW - 20 }, lineSpacing: 5 }
    );

    this.statText = this.scene.add.text(
      leftX + 2 * rectW + 10,
      topY + 10,
      '',
      { fontSize: '13px', color: '#ffffff',
        wordWrap: { width: rectW - 20 }, lineSpacing: 6 }
    );

    this.shopPanel.add([this.generalText, this.statText]);
  }

  /**
   * Creates the prev/next page navigation buttons and adds them to the shop panel container.
   */
  _buildNavButtons() {
    const arrowY = GAME_WINDOW_CENTER.Y;
    const nextX = GAME_WINDOW_WIDTH - 135;
    const prevX = GAME_WINDOW_WIDTH - 180;

    this.prevBtn = this.scene.add.image(prevX, arrowY, 'prev_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this._renderPage(this.currentPage);
        }
      });

    this.nextBtn = this.scene.add.image(nextX, arrowY, 'next_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => {
        if (this.currentPage < this.totalPages - 1) {
          this.currentPage++;
          this._renderPage(this.currentPage);
        }
      });

    this.shopPanel.add([this.prevBtn, this.nextBtn]);
  }

  /**
   * Updates the left panel to show the selected item's paperdoll and stats.
   * @param {object} item - An Armory item definition.
   */
  _renderPreview(item) {
    this.itemOverlay.setTexture(item.id + '_full').setVisible(true);

    this.generalText.setText(
      `${item.displayName}\n\n` +
      `${item.slot.toUpperCase()} | ${item.type.toUpperCase()}` +
      `${item.hands ? ' | ' + item.hands.toUpperCase() : ''}\n\n` +
      `${item.description}`
    );

    this.statText.setText(
      Object.entries(item.stats).map(([k, v]) => `${k}: ${v}`).join('\n')
    );
  }

  /**
   * Destroys the current page's icons and builds a new grid for the given page.
   * The grid fills the right half of the panel. Items are laid out left-to-right,
   * top-to-bottom with equal padding on all sides.
   * @param {number} pageNumber - Zero-based page index.
   */
  _renderPage(pageNumber) {
    this.onPage.forEach(icon => icon.destroy());
    this.onPage = [];
    // How many columns/rows fit in the right half of the panel.
    const cols = Math.floor((this.shopWindowWidth / 2) / CELL_SIZE);
    const rows = Math.floor(this.shopWindowHeight / CELL_SIZE);
    // Center the grid within the available space.
    const paddingX = (this.shopWindowWidth / 2 - cols * CELL_SIZE) / 2;
    const paddingY = (this.shopWindowHeight - rows * CELL_SIZE) / 2;
    // Top-left corner of the grid, starting from the center of the panel.
    const originX = (GAME_WINDOW_CENTER.X + paddingX);
    const originY = (GAME_WINDOW_CENTER.Y - this.shopWindowHeight / 2) + paddingY;
    const itemsPerPage = cols * rows;
    this.totalPages = Math.ceil(this.items.length / itemsPerPage);
    const pageItems = this.items.slice(pageNumber * itemsPerPage, (pageNumber + 1) * itemsPerPage);

    pageItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = originX + col * CELL_SIZE + CELL_SIZE / 2;
      const y = originY + row * CELL_SIZE + CELL_SIZE / 2;

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1a1a1a, 0.5);
      bg.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      bg.lineStyle(1, 0x8B6914, 0.8);
      bg.strokeRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      this.onPage.push(bg);
      this.shopPanel.add(bg);

      const src = this.scene.textures.get(item.id).getSourceImage();
      const scale = Math.min(ICON_SIZE / src.width, ICON_SIZE / src.height);
      const icon = this.scene.add.image(x, y, item.id)
        .setDisplaySize(src.width * scale, src.height * scale)
        .setInteractive();
      icon.on('pointerdown', () => this._renderPreview(item));
      this.onPage.push(icon);
      this.shopPanel.add(icon);
    });
  }

  /** Shows the panel and resets the preview so no stale item is displayed. */
  show() {
    this.itemOverlay.setVisible(false);
    this.generalText.setText('');
    this.statText.setText('');
    this.shopPanel.setVisible(true);
  }

  /** Hides the entire shop panel. */
  hide() { this.shopPanel.setVisible(false); }

  /** Toggles the panel open/closed. */
  toggle() {
    if (this.shopPanel.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
