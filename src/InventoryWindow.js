import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";

const CELL_SIZE = 100;
const ICON_SIZE = 75;
const PANEL_SCALE = 0.75;
const NAV_BTN_WIDTH = 46;
const NAV_BTN_HEIGHT = 167;
const INVENTORY_SIZE = 20;

const INV_COLORS = {
  shopWindow:   { alpha: 0.8 },
  playerDoll:   { alpha: 1 },
  leftPaneRect: { fill: 0x1a1a1a, fillAlpha: 0.5, stroke: 0x8b6914, strokeAlpha: 0.8 },
  previewText:  { color: '#ffffff' },
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
export default class InventoryWindow {
  /**
   * Builds and adds all InventoryWindow UI elements to the scene.
   * The panel starts hidden; call show() to open.
   * @param {Phaser.Scene} scene
   * @param {Inventory} inventory - The player's Inventory instance.
   * @param {Player} player - The player object (for equip overlay updates).
   * @param {object[]} allItems - Full item catalogue from Armory.
   */
  constructor(scene, inventory, player, allItems) {
    this.scene = scene;
    this.inventory = inventory;
    this.player = player;
    this.allItems = allItems;

    this.invWindowWidth  = GAME_WINDOW_WIDTH  * PANEL_SCALE;
    this.invWindowHeight = GAME_WINDOW_HEIGHT * PANEL_SCALE;

    this.equipSlotIcons = {};
    this.popupGroup = null;

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
    this.invPanel = this.scene.add.container(0, 0).setScrollFactor(0);

    this._buildPanel();
    this.invPanel.setDepth(10);

    this.invBtn.on('pointerdown', () => this.toggle());
    this.hide();
  }

  /**
   * Builds all static elements of the panel.
   * Dynamic content (item icons, equipped slot icons) is refreshed in _refresh()
   * which is called each time show() runs.
   */
  _buildPanel() {
    // ── Step 1: Background layers ──
    const shopWindow = this.scene.add.image(
      GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'shop_panel'
    )
      .setDisplaySize(this.invWindowWidth + 100, this.invWindowHeight + 10)
      .setAlpha(INV_COLORS.shopWindow.alpha)
      .setInteractive();

    const bgRect = this.scene.add.rectangle(
      GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y,
      this.invWindowWidth - 7, this.invWindowHeight - 7,
      0xdbc8a8
    ).setAlpha(0.8);

    this.invPanel.add([shopWindow, bgRect]);

    // ── Step 2: Left pane decorative rects ──
    const leftX = GAME_WINDOW_CENTER.X - this.invWindowWidth / 2;
    const topY  = GAME_WINDOW_CENTER.Y - this.invWindowHeight / 2;
    const paneW = this.invWindowWidth / 2;
    const paneH = this.invWindowHeight;
    const rectW = paneW / 3;

    for (let i = 0; i < 3; i++) {
      const rect = this.scene.add.graphics();
      rect.fillStyle(INV_COLORS.leftPaneRect.fill, INV_COLORS.leftPaneRect.fillAlpha);
      rect.fillRect(leftX + i * rectW, topY, rectW, paneH);
      rect.lineStyle(1, INV_COLORS.leftPaneRect.stroke, INV_COLORS.leftPaneRect.strokeAlpha);
      rect.strokeRect(leftX + i * rectW, topY, rectW, paneH);
      this.invPanel.add(rect);
    }

    // ── Step 3: Paperdoll ──
    const dollSize = Math.min(this.invWindowWidth / 2, this.invWindowHeight);
    const dollX = GAME_WINDOW_CENTER.X - this.invWindowWidth / 2 + this.invWindowWidth / 4;

    this.playerDoll = this.scene.add.image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(dollSize, dollSize);
    this.invPanel.add(this.playerDoll);

    // ── Step 4: Equipment slot boxes ──
    const SLOT_BOX_SIZE = 90;
    const SLOT_SPACING  = 120;

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
      const bg = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(SLOT_BOX_SIZE, SLOT_BOX_SIZE)
        .setAlpha(0.5);
      this.invPanel.add(bg);

      // Placeholder icon for the equipped item
      const icon = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(SLOT_BOX_SIZE - 10, SLOT_BOX_SIZE - 10)
        .setVisible(false);
      this.equipSlotIcons[name] = icon;
      this.invPanel.add(icon);

      icon.setInteractive();
      icon.on('pointerdown', () => this._showSlotInfo(name));
      bg.setInteractive();
      bg.on('pointerdown', () => this._showSlotInfo(name));
    }

    // ── Step 6: Right side inventory grid (10 fixed slots) ──
    const cols = Math.floor((this.invWindowWidth / 2) / CELL_SIZE);
    const rows = Math.floor(this.invWindowHeight / CELL_SIZE);

    const paddingX = (this.invWindowWidth / 2 - cols * CELL_SIZE) / 2;
    const paddingY = (this.invWindowHeight  - rows * CELL_SIZE) / 2;
    const originX  = GAME_WINDOW_CENTER.X + paddingX;
    const originY  = GAME_WINDOW_CENTER.Y - this.invWindowHeight / 2 + paddingY;

    this.invSlotIcons = [];

    for (let index = 0; index < INVENTORY_SIZE; index++) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = originX + col * CELL_SIZE + CELL_SIZE / 2;
      const y = originY + row * CELL_SIZE + CELL_SIZE / 2;

      // Dark fill background rect
      const fillRect = this.scene.add.graphics();
      fillRect.fillStyle(INV_COLORS.itemSlotRect.fill, INV_COLORS.itemSlotRect.alpha);
      fillRect.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
      this.invPanel.add(fillRect);

      // Blue border image
      const slotBg = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(CELL_SIZE, CELL_SIZE)
        .setAlpha(0.5);
      this.invPanel.add(slotBg);

      // Item icon placeholder
      const iconImg = this.scene.add.image(x, y, 'icon_bg_blue')
        .setDisplaySize(ICON_SIZE, ICON_SIZE)
        .setVisible(false)
        .setInteractive();
      iconImg.on('pointerdown', () => this._showItemPopup(index, x, y));
      this.invSlotIcons.push(iconImg);
      this.invPanel.add(iconImg);
    }
  }

  /**
   * Reads current inventory and equipment state and updates all icon visuals.
   * Called every time show() runs.
   */
  _refresh() {
    const SLOT_BOX_SIZE = 90;

    // Part A — Update equipped slot icons
    const slots = ['head', 'body', 'bottom', 'feet', 'weapon', 'offhand'];
    for (const slotName of slots) {
      const equippedItem = this.inventory.equipped.get(slotName);
      const iconImg = this.equipSlotIcons[slotName];
      if (equippedItem !== null) {
        iconImg.setTexture(equippedItem.id).setVisible(true);
        const src = this.scene.textures.get(equippedItem.id).getSourceImage();
        const scale = Math.min((SLOT_BOX_SIZE - 10) / src.width, (SLOT_BOX_SIZE - 10) / src.height);
        iconImg.setDisplaySize(src.width * scale, src.height * scale);
      } else {
        iconImg.setVisible(false);
      }
    }

    // Part B — Update inventory slot icons
    const items = [];
    for (let i = 1; i <= 20; i++) {
      items.push(this.inventory.inventory.get(i) || null);
    }

    for (let index = 0; index < INVENTORY_SIZE; index++) {
      const item = items[index];
      const iconImg = this.invSlotIcons[index];
      if (item !== null) {
        iconImg.setTexture(item.id);
        const src = this.scene.textures.get(item.id).getSourceImage();
        const scale = Math.min(ICON_SIZE / src.width, ICON_SIZE / src.height);
        iconImg.setDisplaySize(src.width * scale, src.height * scale);
        iconImg.setVisible(true);
      } else {
        iconImg.setVisible(false);
      }
    }
  }

  /**
   * Shows info for the equipped item in the given slot, or "(empty)" if nothing is equipped.
   * @param {string} slotName - One of head, body, bottom, feet, weapon, offhand.
   */
  _showSlotInfo(slotName) {
    const item = this.inventory.equipped.get(slotName);
    if (!item) {
      return;
    }
  }

  /**
   * Shows an EQUIP / DROP popup above the clicked inventory slot.
   * Clicking outside the popup dismisses it.
   * @param {number} inventoryIndex - Zero-based index into the 10-slot inventory display.
   * @param {number} iconX - World X of the slot center (used to position the popup).
   * @param {number} iconY - World Y of the slot center (used to position the popup).
   */
  _showItemPopup(inventoryIndex, iconX, iconY) {
    const items = [];
    for (let i = 1; i <= 20; i++) {
      items.push(this.inventory.inventory.get(i) || null);
    }
    const item = items[inventoryIndex];
    if (!item) return;

    if (this.popupGroup) {
      this.popupGroup.destroy(true);
      this.popupGroup = null;
    }

    this.popupGroup = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(20);
    this.invPanel.add(this.popupGroup);

    const popupX = iconX;
    const popupY = iconY - CELL_SIZE * 0.6;

    // Background rect
    const popupBg = this.scene.add.graphics();
    popupBg.fillStyle(0x1a1a1a, 0.95);
    popupBg.fillRoundedRect(popupX - 60, popupY - 30, 120, 70, 6);
    popupBg.lineStyle(1, 0x8b6914, 0.9);
    popupBg.strokeRoundedRect(popupX - 60, popupY - 30, 120, 70, 6);
    this.popupGroup.add(popupBg);

    // EQUIP button
    const equipBtn = this.scene.add.text(popupX, popupY - 10, 'EQUIP', {
      fontSize: '14px', color: '#ffd700',
      backgroundColor: '#2a2a2a', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive();
    equipBtn.on('pointerdown', () => {
      this.inventory.equipItemFromInventory(item);
      this.player.equip(item);
      this._ensureOverlayLoaded(item);
      this._destroyPopup();
      this._refresh();
    });
    this.popupGroup.add(equipBtn);

    // DROP button
    const dropBtn = this.scene.add.text(popupX, popupY + 20, 'DROP', {
      fontSize: '14px', color: '#ff6666',
      backgroundColor: '#2a2a2a', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive();
    dropBtn.on('pointerdown', () => {
      this.inventory.removeItemFromInventory(item);
      this._destroyPopup();
      this._refresh();
    });
    this.popupGroup.add(dropBtn);

    // Transparent dismiss overlay behind the popup
    const dismissOverlay = this.scene.add.rectangle(
      GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y,
      GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT,
      0x000000, 0
    ).setInteractive();
    dismissOverlay.on('pointerdown', () => this._destroyPopup());
    this.popupGroup.addAt(dismissOverlay, 0);
  }

  /**
   * Destroys the currently visible popup, if any.
   */
  _destroyPopup() {
    if (this.popupGroup) {
      this.popupGroup.destroy(true);
      this.popupGroup = null;
    }
  }

  /**
   * Stub: warns that overlay spritesheets for this item are not dynamically loaded.
   * Full implementation requires scene-level dynamic asset loading.
   * @param {object} item - The item being equipped.
   */
  _ensureOverlayLoaded(item) {
    console.warn(
      'InventoryWindow: overlay assets not loaded for', item.baseName,
      '— equip overlay will not display until scene implements dynamic asset loading.'
    );
  }

  /** Shows the panel and refreshes all icons. */
  show() {
    this._destroyPopup();
    this._refresh();
    this.invPanel.setVisible(true);
  }

  /** Hides the entire inventory panel. */
  hide() {
    this._destroyPopup();
    this.invPanel.setVisible(false);
  }

  /** Toggles the panel open/closed. */
  toggle() {
    if (this.invPanel.visible) {
      this.hide();
    } else {
      this.scene.shop?.hide();
      this.show();
    }
  }
}
