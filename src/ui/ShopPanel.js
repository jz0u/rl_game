import {
  GAME_WINDOW_WIDTH,
  GAME_WINDOW_CENTER,
  CELL_SIZE,
  ICON_SIZE,
  NAV_BTN_WIDTH,
  NAV_BTN_HEIGHT,
  DEPTH_UI,
} from '../config/constants';
import BasePanel from './BasePanel';
import SelectionBorder from './SelectionBorder';
import { scaleIcon } from '../config/utils';
import Shop from '../systems/Shop';

const TAB_ROW_HEIGHT = 28;

export default class ShopPanel extends BasePanel {
  /**
   * Builds and adds all Shop UI elements to the scene.
   * The panel starts hidden; call show() to open.
   * @param {Phaser.Scene} scene
   * @param {object[]} items - Full item catalogue from Armory (all slots combined).
   */
  constructor(scene, items) {
    super(scene);
    this.items        = items;
    this.currentPage  = 0;
    this.activeFilter = 'all';
    this.filterTabs   = [];
    this.shop         = new Shop();
    /** Icons currently rendered on this page; destroyed and rebuilt on page change. */
    this.onPage = [];

    // ── Shop panel container ──
    this.shopPanel = this._buildContainer();

    this._buildPreviewPane();
    this._buildNavButtons();
    this._renderPage(0);
    this.shopPanel.bringToTop(this.prevBtn);
    this.shopPanel.bringToTop(this.nextBtn);
    this._buildFilterTabs();

    this.shopPanel.setDepth(DEPTH_UI);

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
      color: '#ffffff',
      wordWrap: { width: rectW - 52 },
      lineSpacing: 5,
      padding: { left: 16, right: 16, top: 12, bottom: 12 },
    });

    this.statText = this.scene.add.text(leftX + 2 * rectW + 10, topY + 10, '', {
      fontSize: '13px',
      color: '#ffffff',
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
    this.itemOverlay.setTexture(item.id + '_overlay').setVisible(true);

    this.generalText.setText(
      `${item.displayName}\n\n` +
        `${item.equipSlot.toUpperCase()} | ${(item.weightClass ?? item.rangeType).toUpperCase()}` +
        `${item.handType ? ' | ' + item.handType.toUpperCase() : ''}\n\n` +
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
    const rows = Math.floor((this.windowHeight - TAB_ROW_HEIGHT) / CELL_SIZE);
    const paddingX = (this.windowWidth / 2 - cols * CELL_SIZE) / 2;
    const paddingY = (this.windowHeight - TAB_ROW_HEIGHT - rows * CELL_SIZE) / 2;
    const originX  = GAME_WINDOW_CENTER.X + paddingX;
    const originY  = GAME_WINDOW_CENTER.Y - this.windowHeight / 2 + paddingY + TAB_ROW_HEIGHT;

    const filtered     = this.filteredItems;
    const itemsPerPage = cols * rows;
    this.totalPages = Math.ceil(filtered.length / itemsPerPage);
    const pageItems = filtered.slice(
      pageNumber * itemsPerPage,
      (pageNumber + 1) * itemsPerPage,
    );

    pageItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x   = originX + col * CELL_SIZE + CELL_SIZE / 2;
      const y   = originY + row * CELL_SIZE + CELL_SIZE / 2;

      const goldRect = this.scene.add.graphics();
      goldRect.fillStyle(0x1a1a1a, 0.5);
      goldRect.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      this.onPage.push(goldRect);
      this.shopPanel.add(goldRect);

      const bg = this.scene.add
        .image(x, y, 'icon_bg_blue')
        .setDisplaySize(CELL_SIZE, CELL_SIZE)
        .setAlpha(0.5)
        .setScrollFactor(0);
      this.onPage.push(bg);
      this.shopPanel.add(bg);
      const handleSelect = (pointer) => {
        const wasNew = this.selectionBorder.selectedItem !== item;
        this.selectionBorder.advance(item, x, y, () => this._buyItem(item), 'buy');
        if (wasNew) this._renderPreview(item);
      };
      bg.setInteractive();
      bg.on('pointerdown', handleSelect);

      const src   = this.scene.textures.get(item.id).getSourceImage();
      const scale = scaleIcon(src, ICON_SIZE);
      const icon  = this.scene.add
        .image(x, y, item.id)
        .setDisplaySize(src.width * scale, src.height * scale)
        .setScrollFactor(0)
        .setInteractive();
      icon.on('pointerdown', handleSelect);
      this.onPage.push(icon);
      this.shopPanel.add(icon);
    });

    this.shopPanel.bringToTop(this.selectionBorder.border);
    if (this.prevBtn) {
      this.shopPanel.bringToTop(this.prevBtn);
      this.shopPanel.bringToTop(this.nextBtn);
    }
    this.filterTabs.forEach(t => this.shopPanel.bringToTop(t));
  }

  /** Returns items filtered by the active slot tab. Recomputed on every call. */
  get filteredItems() {
    if (this.activeFilter === 'all') return this.items;
    return this.items.filter(item => item.equipSlot === this.activeFilter);
  }

  /** Builds the horizontal row of slot filter tabs above the item grid. */
  _buildFilterTabs() {
    const SLOT_ORDER = ['all','head','amulet','shoulder','body_inner','body_outer','hands','legs','feet','primary','secondary'];
    const LABEL_MAP  = {
      all: 'ALL', head: 'HEAD', amulet: 'AMULET', shoulder: 'SHLDR',
      body_inner: 'BODY', body_outer: 'OUTER', hands: 'HANDS',
      legs: 'LEGS', feet: 'FEET', primary: 'WEAPON', secondary: 'OFF',
    };

    const usedSlots = new Set(this.items.map(i => i.equipSlot));
    const slots = SLOT_ORDER.filter(s => s === 'all' || usedSlots.has(s));

    const tabY = GAME_WINDOW_CENTER.Y - this.windowHeight / 2 + 14;
    let tabX   = GAME_WINDOW_CENTER.X + 4;

    slots.forEach(slot => {
      const tab = this.scene.add.text(tabX, tabY, LABEL_MAP[slot], {
        fontSize: '11px',
        color: '#aaaaaa',
        backgroundColor: '#222',
        padding: { x: 5, y: 3 },
      })
      .setScrollFactor(0)
      .setInteractive();

      tab.on('pointerdown', () => {
        this.activeFilter = slot;
        this.currentPage  = 0;
        this._renderPage(0);
        this._refreshTabHighlights();
      });

      this.shopPanel.add(tab);
      this.shopPanel.bringToTop(tab);
      this.filterTabs.push(tab);
      tabX += tab.width + 6;
    });

    this._refreshTabHighlights();
  }

  /** Highlights the active tab in gold; dims all others. */
  _refreshTabHighlights() {
    const SLOT_ORDER = ['all','head','amulet','shoulder','body_inner','body_outer','hands','legs','feet','primary','secondary'];
    const usedSlots  = new Set(this.items.map(i => i.equipSlot));
    const slots      = SLOT_ORDER.filter(s => s === 'all' || usedSlots.has(s));

    this.filterTabs.forEach((tab, i) => {
      tab.setColor(slots[i] === this.activeFilter ? '#ffdd57' : '#aaaaaa');
    });
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
   * Delegates entirely to EquipmentManager.buy() which handles the shop call
   * and asset loading atomically.
   * @param {object} item - An Armory item definition.
   */
  _buyItem(item) {
    return this.scene.equipmentManager.buy(item);
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
