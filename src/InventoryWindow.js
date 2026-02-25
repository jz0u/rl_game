import { GAME_WINDOW_WIDTH, GAME_WINDOW_CENTER, CELL_SIZE, ICON_SIZE, NAV_BTN_WIDTH, NAV_BTN_HEIGHT, SLOT_BOX_SIZE, SLOT_SPACING } from './constants';
import BaseWindow from './BaseWindow';
import SelectionBorder from './SelectionBorder';
import { scaleIcon } from './utils';
import { loadEquipmentAssets } from './pipelines/loadEquipmentAssets';
import { INVENTORY_SIZE } from './Inventory';

const INV_COLORS = {
  itemSlotRect: { fill: 0x1a1a1a, alpha: 0.5 },
  toggleBtn:    { background: '#333', color: '#fff' },
  border_alpha: { alpha: 0.5 },
};

/**
 * InventoryWindow — the in-game inventory and equipment UI.
 *
 * Layout: the panel occupies 75% of the window.
 *   Left half  → paperdoll with equipment slot boxes + slot info text.
 *   Right half → fixed 10-slot inventory grid.
 *
 * Clicking an inventory icon opens a popup with EQUIP and DROP actions.
 * Clicking an equipment slot shows that slot's item info in the text area.
 * The panel is toggled via the "BAG" button.
 */
export default class InventoryWindow extends BaseWindow {
  /**
   * Builds and adds all InventoryWindow UI elements to the scene.
   * The panel starts hidden; call show() to open.
   * @param {Phaser.Scene} scene
   * @param {Inventory} inventory - The player's Inventory instance.
   * @param {Player} player - The player object (for equip overlay updates).
   * @param {object[]} allItems - Full item catalogue from Armory.
   */
  constructor(scene, inventory, player, allItems) {
    super(scene);
    this.inventory = inventory;
    this.player    = player;
    this.allItems  = allItems;

    this.equipSlotIcons = {};
    this.currentPage = 0;

    // ── Toggle button ──
    this.invBtn = this.scene.add
      .text(20, 56, 'BAG', {
        fontSize: '16px',
        backgroundColor: INV_COLORS.toggleBtn.background,
        padding: { x: 10, y: 6 },
        color: INV_COLORS.toggleBtn.color,
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── Inventory panel container ──
    this.invPanel = this._buildContainer();

    this._buildPanel();
    this.invPanel.setDepth(10);

    this.invBtn.on('pointerdown', () => this.scene.windowManager.open(this));
    this.hide();
  }

  /**
   * Builds all static elements of the panel.
   * Dynamic content (item icons, equipped slot icons) is refreshed in _refresh()
   * which is called each time show() runs.
   */
  _buildPanel() {
    // ── Step 1: Background layers ──
    this._buildBackground(this.invPanel);

    // ── Step 2: Left pane decorative rects ──
    this._buildLeftPaneRects(this.invPanel);

    // ── Step 3: Paperdoll ──
    const { dollX, dollSize } = this._buildPaperdoll(this.invPanel);

    this.itemOverlays = {};
    const overlaySlots = ['head', 'body', 'bottom', 'feet', 'weapon', 'offhand'];
    for (const slotName of overlaySlots) {
      const overlay = this.scene.add.image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
        .setDisplaySize(dollSize, dollSize)
        .setVisible(false);
      this.itemOverlays[slotName] = overlay;
      this.invPanel.add(overlay);
    }

    // ── Step 4: Equipment slot boxes ──
    const leftColX  = dollX - dollSize * 0.32;
    const rightColX = dollX + dollSize * 0.32;

    const rowY = [
      GAME_WINDOW_CENTER.Y - SLOT_SPACING,
      GAME_WINDOW_CENTER.Y,
      GAME_WINDOW_CENTER.Y + SLOT_SPACING,
    ];

    const leftColSlots  = ['head', 'body', 'weapon'];
    const rightColSlots = ['bottom', 'feet', 'offhand'];

    const slotLayout = [
      ...leftColSlots.map((name, i)  => ({ name, x: leftColX,  y: rowY[i] })),
      ...rightColSlots.map((name, i) => ({ name, x: rightColX, y: rowY[i] })),
    ];

    for (const { name, x, y } of slotLayout) {
      // Blue background square
      const bg = this.scene.add.image(x, y, 'slot_box')
        .setDisplaySize(SLOT_BOX_SIZE, SLOT_BOX_SIZE)
        .setAlpha(.7);
      this.invPanel.add(bg);

      // Placeholder icon for the equipped item
      const icon = this.scene.add.image(x, y, 'slot_box')
        .setDisplaySize(SLOT_BOX_SIZE - 10, SLOT_BOX_SIZE - 10)
        .setVisible(false);
      this.equipSlotIcons[name] = icon;
      this.invPanel.add(icon);

      bg.setInteractive();
      bg.on('pointerdown', (pointer) => this._handleEquippedSlotClick(name, pointer, x, y));
      icon.setInteractive();
      icon.on('pointerdown', (pointer) => this._handleEquippedSlotClick(name, pointer, x, y));
    }

    // ── Step 6: Right side inventory grid ──
    const cols = Math.floor((this.windowWidth / 2) / CELL_SIZE);
    const rows = Math.floor(this.windowHeight / CELL_SIZE);
    this.itemsPerPage = cols * rows;

    const paddingX = (this.windowWidth / 2 - cols * CELL_SIZE) / 2;
    const paddingY = (this.windowHeight  - rows * CELL_SIZE) / 2;
    const originX  = GAME_WINDOW_CENTER.X + paddingX;
    const originY  = GAME_WINDOW_CENTER.Y - this.windowHeight / 2 + paddingY;

    this.invSlotIcons = [];

    for (let index = 0; index < this.itemsPerPage; index++) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x   = originX + col * CELL_SIZE + CELL_SIZE / 2;
      const y   = originY + row * CELL_SIZE + CELL_SIZE / 2;

      // Dark fill background rect
      const fillRect = this.scene.add.graphics();
      fillRect.fillStyle(INV_COLORS.itemSlotRect.fill, INV_COLORS.itemSlotRect.alpha);
      fillRect.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      this.invPanel.add(fillRect);

      // Blue border image
      const slotBg = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(CELL_SIZE, CELL_SIZE)
        .setAlpha(INV_COLORS.border_alpha.alpha);
      this.invPanel.add(slotBg);
      slotBg.setInteractive();
      slotBg.on('pointerdown', (pointer) => {
        const items = [];
        for (let i = 1; i <= INVENTORY_SIZE; i++) { items.push(this.inventory.inventory.get(i) || null); }
        const item = items[this.currentPage * this.itemsPerPage + index];
        if (!item) return;

        if (pointer.rightButtonDown()) {
          // Right-click — drop progression
          this.selectionBorder.advance(item, x, y, () => {
            this.inventory.removeItemFromInventory(item);
            this._refresh();
          }, 'drop');
        } else {
          // Left-click — equip progression
          this.selectionBorder.advance(item, x, y, () => {
            this.inventory.equipItemFromInventory(item);
            this.player.equip(item);
            this._ensureOverlayLoaded(item);
            this._refresh();
          }, 'equip');
        }
      });

      // Item icon placeholder
      const iconImg = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(ICON_SIZE, ICON_SIZE)
        .setVisible(false);
      this.invSlotIcons.push(iconImg);
      this.invPanel.add(iconImg);
    }

    this.selectionBorder = new SelectionBorder(this.scene, this.invPanel);

    const arrowY = GAME_WINDOW_CENTER.Y;
    const nextX  = GAME_WINDOW_WIDTH - 135;
    const prevX  = GAME_WINDOW_WIDTH - 187;

    this.prevBtn = this.scene.add
      .image(prevX, arrowY, 'prev_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20)
      .on('pointerdown', () => {
        this.currentPage = Math.max(0, this.currentPage - 1);
        this._refresh();
      });

    this.nextBtn = this.scene.add
      .image(nextX, arrowY, 'next_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(20)
      .on('pointerdown', () => {
        const totalPages = Math.ceil(INVENTORY_SIZE / this.itemsPerPage);
        this.currentPage = Math.min(totalPages - 1, this.currentPage + 1);
        this._refresh();
      });

    this.invPanel.add([this.prevBtn, this.nextBtn]);
    this.invPanel.bringToTop(this.selectionBorder.border);
    this.invPanel.bringToTop(this.prevBtn);
    this.invPanel.bringToTop(this.nextBtn);
  }

  /**
   * Reads current inventory and equipment state and updates all icon visuals.
   * Called every time show() runs.
   */
  _refresh() {
    // Part A — Update equipped slot icons
    const slots = ['head', 'body', 'bottom', 'feet', 'weapon', 'offhand'];
    for (const slotName of slots) {
      const equippedItem = this.inventory.equipped.get(slotName);
      const iconImg      = this.equipSlotIcons[slotName];
      if (equippedItem !== null) {
        iconImg.setTexture(equippedItem.id).setVisible(true);
        const src   = this.scene.textures.get(equippedItem.id).getSourceImage();
        const scale = scaleIcon(src, SLOT_BOX_SIZE - 10);
        iconImg.setDisplaySize(src.width * scale, src.height * scale);
      } else {
        iconImg.setVisible(false);
      }
    }

    for (const slotName of slots) {
      const equippedItem = this.inventory.equipped.get(slotName);
      const overlay      = this.itemOverlays[slotName];
      if (equippedItem !== null) {
        overlay.setTexture(equippedItem.id + '_full').setVisible(true);
      } else {
        overlay.setVisible(false);
      }
    }

    // Part B — Update inventory slot icons
    const items = [];
    for (let i = 1; i <= INVENTORY_SIZE; i++) {
      items.push(this.inventory.inventory.get(i) || null);
    }

    const totalPages = Math.max(1, Math.ceil(INVENTORY_SIZE / this.itemsPerPage));
    if (this.currentPage >= totalPages) this.currentPage = totalPages - 1;
    const pageItems = items.slice(this.currentPage * this.itemsPerPage, (this.currentPage + 1) * this.itemsPerPage);

    for (let index = 0; index < this.itemsPerPage; index++) {
      const item    = pageItems[index] || null;
      const iconImg = this.invSlotIcons[index];
      if (item !== null) {
        iconImg.setTexture(item.id);
        const src   = this.scene.textures.get(item.id).getSourceImage();
        const scale = scaleIcon(src, ICON_SIZE);
        iconImg.setDisplaySize(src.width * scale, src.height * scale);
        iconImg.setVisible(true);
      } else {
        iconImg.setVisible(false);
      }
    }

    this.prevBtn.setVisible(totalPages > 1);
    this.nextBtn.setVisible(totalPages > 1);
    if (this.selectionBorder) this.invPanel.bringToTop(this.selectionBorder.border);
  }

  /**
   * Handles pointer clicks on an equipped slot box with right-click unequip progression.
   * @param {string} slotName - One of head, body, bottom, feet, weapon, offhand.
   * @param {Phaser.Input.Pointer} pointer
   * @param {number} x - World X of the slot center.
   * @param {number} y - World Y of the slot center.
   */
  _handleEquippedSlotClick(slotName, pointer, x, y) {
    const item = this.inventory.equipped.get(slotName);
    if (!item) return;

    if (pointer.rightButtonDown()) {
      // Right-click — unequip progression
      this.selectionBorder.advance(item, x, y, () => {
        this.inventory.removeItemFromEquipped(item);
        this.player.unequip(slotName);
        this._refresh();
      }, 'drop');
    }
  }

  /**
   * Ensures the equipment overlay spritesheets and animations for the given item
   * are loaded into the scene, then refreshes the player overlay sprite's texture.
   * @param {object} item - The item being equipped.
   */
  _ensureOverlayLoaded(item) {
    loadEquipmentAssets(this.scene, item);
  }

  /** Shows the panel and refreshes all icons. */
  show() {
    this.selectionBorder.reset();
    this._refresh();
    this.invPanel.setVisible(true);
  }

  /** Hides the entire inventory panel. */
  hide() {
    this.invPanel.setVisible(false);
  }

  /** Toggles the panel open/closed. */
  toggle() {
    if (this.invPanel.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
