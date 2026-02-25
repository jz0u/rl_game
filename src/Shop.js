import {
  GAME_WINDOW_WIDTH,
  GAME_WINDOW_CENTER,
  CELL_SIZE,
  ICON_SIZE,
  NAV_BTN_WIDTH,
  NAV_BTN_HEIGHT,
} from './constants';
import BaseWindow from './BaseWindow';
import SelectionBorder from './SelectionBorder';
import { scaleIcon } from './utils';
import { loadEquipmentAssets } from './pipelines/loadEquipmentAssets';

const SHOP_COLORS = {
  previewText:  { color: '#ffffff' },
  itemSlotRect: { fill: 0x1a1a1a, alpha: 0.5 },
  toggleBtn:    { background: '#333', color: '#fff' },
  border_alpha: { alpha: 0.5 },
};

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
export default class Shop extends BaseWindow {
  /**
   * Builds and adds all Shop UI elements to the scene.
   * The panel starts hidden; call show() to open.
   * @param {Phaser.Scene} scene
   * @param {object[]} items - Full item catalogue from Armory (all slots combined).
   */
  constructor(scene, items) {
    super(scene);
    this.items       = items;
    this.currentPage = 0;
    /** Icons currently rendered on this page; destroyed and rebuilt on page change. */
    this.onPage = [];

    // ── Toggle button ──
    this.shopBtn = this.scene.add
      .text(20, 20, 'ITEMS', {
        fontSize: '16px',
        backgroundColor: SHOP_COLORS.toggleBtn.background,
        padding: { x: 10, y: 6 },
        color: SHOP_COLORS.toggleBtn.color,
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── Shop panel container ──
    this.shopPanel = this._buildContainer();

    this._buildPreviewPane();
    this._buildNavButtons();
    this._renderPage(0);
    this.shopPanel.bringToTop(this.prevBtn);
    this.shopPanel.bringToTop(this.nextBtn);

    this.shopPanel.setDepth(10);

    this.shopBtn.on('pointerdown', () => this.scene.windowManager.open(this));
    this.hide();
  }

  /**
   * Creates the paperdoll image, item overlay, and stat text objects,
   * then adds them to the shop panel container.
   */
  _buildPreviewPane() {
    this._buildBackground(this.shopPanel);

    const { dollX, dollSize } = this._buildPaperdoll(this.shopPanel);

    this.itemOverlay = this.scene.add
      .image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(dollSize, dollSize)
      .setVisible(false);
    this.shopPanel.add(this.itemOverlay);

    this._buildLeftPaneRects(this.shopPanel);

    const leftX = GAME_WINDOW_CENTER.X - this.windowWidth / 2;
    const topY  = GAME_WINDOW_CENTER.Y - this.windowHeight / 2;
    const rectW = this.windowWidth / 6; // (windowWidth / 2) / 3

    this.generalText = this.scene.add.text(leftX + 10, topY + 10, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: SHOP_COLORS.previewText.color,
      wordWrap: { width: rectW - 52 },
      lineSpacing: 5,
      padding: { left: 16, right: 16, top: 12, bottom: 12 },
    });

    this.statText = this.scene.add.text(leftX + 2 * rectW + 10, topY + 10, '', {
      fontSize: '13px',
      color: SHOP_COLORS.previewText.color,
      wordWrap: { width: rectW - 52 },
      lineSpacing: 6,
      padding: { left: 16, right: 16, top: 12, bottom: 12 },
    });

    this.shopPanel.add([this.generalText, this.statText]);

    this.selectionBorder = new SelectionBorder(this.scene, this.shopPanel);
  }

  /**
   * Creates the prev/next page navigation buttons and adds them to the shop panel container.
   */
  _buildNavButtons() {
    const arrowY = GAME_WINDOW_CENTER.Y;
    const nextX  = GAME_WINDOW_WIDTH - 135;
    const prevX  = GAME_WINDOW_WIDTH - 187;

    this.prevBtn = this.scene.add
      .image(prevX, arrowY, 'prev_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this._renderPage(this.currentPage);
        }
      });

    this.nextBtn = this.scene.add
      .image(nextX, arrowY, 'next_btn')
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
        `${item.description}`,
    );

    this.statText.setText(
      Object.entries(item.stats)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
    );
  }

  /**
   * Destroys the current page's icons and builds a new grid for the given page.
   * @param {number} pageNumber - Zero-based page index.
   */
  _renderPage(pageNumber) {
    this.onPage.forEach((icon) => icon.destroy());
    this.onPage = [];
    this.selectionBorder.reset();

    const cols = Math.floor(this.windowWidth / 2 / CELL_SIZE);
    const rows = Math.floor(this.windowHeight / CELL_SIZE);
    const paddingX = (this.windowWidth / 2 - cols * CELL_SIZE) / 2;
    const paddingY = (this.windowHeight - rows * CELL_SIZE) / 2;
    const originX  = GAME_WINDOW_CENTER.X + paddingX;
    const originY  = GAME_WINDOW_CENTER.Y - this.windowHeight / 2 + paddingY;

    const itemsPerPage = cols * rows;
    this.totalPages = Math.ceil(this.items.length / itemsPerPage);
    const pageItems = this.items.slice(
      pageNumber * itemsPerPage,
      (pageNumber + 1) * itemsPerPage,
    );

    pageItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x   = originX + col * CELL_SIZE + CELL_SIZE / 2;
      const y   = originY + row * CELL_SIZE + CELL_SIZE / 2;

      const goldRect = this.scene.add.graphics();
      goldRect.fillStyle(SHOP_COLORS.itemSlotRect.fill, SHOP_COLORS.itemSlotRect.alpha);
      goldRect.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      this.onPage.push(goldRect);
      this.shopPanel.add(goldRect);

      const bg = this.scene.add
        .image(x, y, 'icon_bg_blue')
        .setDisplaySize(CELL_SIZE, CELL_SIZE)
        .setAlpha(SHOP_COLORS.border_alpha.alpha);
      this.onPage.push(bg);
      this.shopPanel.add(bg);
      bg.setInteractive();
      bg.on('pointerdown', () => {
        const wasNew = this.selectionBorder.selectedItem !== item;
        this.selectionBorder.advance(item, x, y, () => this._buyItem(item), 'buy');
        if (wasNew) this._renderPreview(item);
      });

      const src   = this.scene.textures.get(item.id).getSourceImage();
      const scale = scaleIcon(src, ICON_SIZE);
      const icon  = this.scene.add
        .image(x, y, item.id)
        .setDisplaySize(src.width * scale, src.height * scale);
      this.onPage.push(icon);
      this.shopPanel.add(icon);
    });

    this.shopPanel.bringToTop(this.selectionBorder.border);
    if (this.prevBtn) {
      this.shopPanel.bringToTop(this.prevBtn);
      this.shopPanel.bringToTop(this.nextBtn);
    }
  }

  /** Shows the panel and resets the preview so no stale item is displayed. */
  show() {
    this.itemOverlay.setVisible(false);
    this.generalText.setText('');
    this.statText.setText('');
    this.shopPanel.setVisible(true);
  }

  /**
   * Attempts to purchase an item and add it to the player's inventory.
   * Fails silently with a console warning if the player cannot afford it or inventory is full.
   * @param {object} item - An Armory item definition.
   */
  _buyItem(item) {
    const player    = this.scene.player;
    const inventory = this.scene.inventory;

    if (player.balance < item.value) return false;

    const result = inventory.addItemToInventory(item);
    if (result === false) return false;

    player.balance -= item.value;
    loadEquipmentAssets(this.scene, item);
  }

  /** Hides the entire shop panel. */
  hide() {
    this.shopPanel.setVisible(false);
  }

  /** Toggles the panel open/closed. */
  toggle() {
    if (this.shopPanel.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
