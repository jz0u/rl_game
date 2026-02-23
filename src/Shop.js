import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";

const CELL_SIZE = 100; // pixel size of each grid slot in the item list
const ICON_SIZE = 75;  // display size of the item icon within each slot

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
    this.ShopWindowWidth = GAME_WINDOW_WIDTH * .75;
    this.ShopWindowHeight = GAME_WINDOW_HEIGHT * .75;


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

    const shopWindow = this.scene.add.image(GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'shop_panel')
      .setDisplaySize(this.ShopWindowWidth + 100, this.ShopWindowHeight + 10)
      .setAlpha(0.8)
      .setInteractive();
    
    this.playerDoll = this.scene.add.image(GAME_WINDOW_CENTER.X - this.ShopWindowWidth / 2 + (this.ShopWindowWidth / 4) / 2, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(this.ShopWindowWidth / 2, this.ShopWindowHeight)
      .setAlpha(1)
      .setInteractive();

    this.itemOverlay = this.scene.add.image(
      GAME_WINDOW_CENTER.X - this.ShopWindowWidth / 2 + (this.ShopWindowWidth / 4) / 2,
      GAME_WINDOW_CENTER.Y,
      'player_paperdoll'
    )
      .setDisplaySize(this.ShopWindowWidth / 2, this.ShopWindowHeight)
      .setVisible(false);

 
    
    this.shopPanel.add([shopWindow, this.playerDoll, this.itemOverlay]);
    this.nameText = this.scene.add.text( GAME_WINDOW_CENTER.X - this.ShopWindowWidth / 4 + 10,
      GAME_WINDOW_CENTER.Y - this.ShopWindowHeight / 2 + 40,
      '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    this.statsText = this.scene.add.text(
      GAME_WINDOW_CENTER.X - this.ShopWindowWidth / 4 + 10,
      GAME_WINDOW_CENTER.Y - this.ShopWindowHeight / 2 + 70,
      '',
      {
        fontSize: '13px',
        color: '#ffffff',
        wordWrap: { width: this.ShopWindowWidth / 4 - 20 },
        lineSpacing: 6,
      }
    );
    this.shopPanel.add([this.nameText, this.statsText]);
    this._renderPage(0);
    // ── Prev/Next buttons ──
    const panelBottom = (GAME_WINDOW_CENTER.Y + this.ShopWindowHeight / 2 - this.ShopWindowHeight * 0.05) + 10;
    const nextX = GAME_WINDOW_CENTER.X + this.ShopWindowWidth / 2 - 10;
    const prevX = nextX - 30;
    this.prevBtn = this.scene.add.image(prevX, panelBottom, 'prev_btn')
      .setDisplaySize(30, 30)
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this._renderPage(this.currentPage);
        }
      });

    this.nextBtn = this.scene.add.image(nextX - 10, panelBottom, 'next_btn')
      .setDisplaySize(30, 30)
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => {
        if (this.currentPage < this.totalPages - 1) {
          this.currentPage++;
          this._renderPage(this.currentPage);
        }
      });

    this.shopPanel.add([this.prevBtn, this.nextBtn]);


    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
  }
  /**
   * Updates the left panel to show the selected item's paperdoll and stats.
   * @param {object} item - An Armory item definition.
   */
  _renderPreview(item) {
    this.itemOverlay.setTexture(item.id + '_full').setVisible(true);
    const statsLines = Object.entries(item.stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    this.nameText.setText(item.displayName);
    this.statsText.setText(
      `${item.slot.toUpperCase()} | ${item.type.toUpperCase()}${item.hands ? ' | ' + item.hands.toUpperCase() : ''}\n\n` +
      `${statsLines}\n\n` +
      `${item.description}`
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
    const cellSize = CELL_SIZE;
    const iconSize = ICON_SIZE;
    // How many columns/rows fit in the right half of the panel.
    const cols = Math.floor((this.ShopWindowWidth / 2) / cellSize);
    const rows = Math.floor(this.ShopWindowHeight / cellSize);
    // Center the grid within the available space.
    const paddingX = (this.ShopWindowWidth / 2 - cols * cellSize) / 2;
    const paddingY = (this.ShopWindowHeight - rows * cellSize) / 2;
    // Top-left corner of the grid, starting from the center of the panel.
    const originX = (GAME_WINDOW_CENTER.X + paddingX);
    const originY = (GAME_WINDOW_CENTER.Y - this.ShopWindowHeight / 2) + paddingY;
    const itemsPerPage = cols * rows;
    this.totalPages = Math.ceil(this.items.length / itemsPerPage);
    const pageItems = this.items.slice(pageNumber * itemsPerPage, (pageNumber + 1) * itemsPerPage);

    pageItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = originX + col * cellSize + cellSize / 2;
      const y = originY + row * cellSize + cellSize / 2;

      const icon = this.scene.add.image(x, y, item.id)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive();
      icon.on('pointerdown', () => this._renderPreview(item));
      this.onPage.push(icon);
      this.shopPanel.add(icon);
    });
  }

  /** Shows the panel and resets the preview so no stale item is displayed. */
  show() {
    this.itemOverlay.setVisible(false);
    this.statsText.setText('');
    this.shopPanel.setVisible(true);
    this.nameText.setText('');
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
