import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";

const CELL_SIZE = 100; // pixel size of each grid slot in the item list
const ICON_SIZE = 75;  // display size of the item icon within each slot

export default class Inventory {
    constructor(scene) {
        this.currentPage = 0;
        this.onPage = [];
        this.InventoryWindowWidth = GAME_WINDOW_WIDTH * .75;
        this.InventoryWindowHeight = GAME_WINDOW_HEIGHT * .75;
        this.scene = scene;
        this.itemSetForDupeCheckInventory = new Set();
        this.itemSetForDupeCheckEquipped = new Set();
        this.itemsInInventory = 0;
        this.INVENTORYSIZE = 10;

        this.inventory = new Map();
        this.equipped = new Map();

        this.equipped.set('head', null);
        this.equipped.set('body', null);
        this.equipped.set('bottom', null);
        this.equipped.set('feet', null);
        this.equipped.set('weapon', null);
        this.equipped.set('offhand', null);

        this.revertedInventoryMap = new Map();
        this.emptySlots = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        ////////////////////////////
        //inventory button
        this.invBtn = this.scene.add
            .text(20, 60, "INVENTORY", {
                fontSize: "16px",
                backgroundColor: "#333",
                padding: { x: 10, y: 6 },
                color: "#fff",
            })
            .setInteractive()
            .setScrollFactor(0);
        // ── inventory panel container ──
        this.inventoryPanel = this.scene.add.container(0, 0).setScrollFactor(0);

        const inventoryWindow = this.scene.add.image(GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'inventory_panel')
            .setDisplaySize(this.InventoryWindowWidth + 100, this.InventoryWindowHeight + 10)
            .setAlpha(0.8)
            .setInteractive();

        this.inventoryPanel.add([inventoryWindow]);
        this.inventoryPanel.setDepth(10);
        this.invBtn.on('pointerdown', () => this.toggle());
        
        this._renderSlots();
        this.hide();
    }//end constructor
    _renderSlots() {
        const cols = 5;
        const rows = 2;
        const totalSlots = cols * rows; // 10 slots
    
        // Center the grid in the panel
        const gridWidth  = cols * CELL_SIZE;
        const gridHeight = rows * CELL_SIZE;
        const originX = GAME_WINDOW_CENTER.X - gridWidth / 2 + CELL_SIZE / 2;
        const originY = GAME_WINDOW_CENTER.Y - gridHeight / 2 + CELL_SIZE / 2;
    
        for (let i = 0; i < totalSlots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = originX + col * CELL_SIZE;
            const y = originY + row * CELL_SIZE;
    
            // Draw the slot background box
            const bg = this.scene.add.graphics();
            bg.fillStyle(0x1a1a1a, 0.5);
            bg.fillRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
            bg.lineStyle(1, 0x8B6914, 0.8);
            bg.strokeRect(x - CELL_SIZE / 2, y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
    
            this.inventoryPanel.add(bg);
        }
    }

    _addItemToInventory(item) {
        //if there is no more room in inventory return false
        if (this.itemsInInventory >= this.INVENTORYSIZE) {
            return false;
        }
        //if inventory already contains the item return false
        else if (this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else { //sucess 
            const slot = this.emptySlots.values().next().value;
            this.emptySlots.delete(slot);
            this.inventory.set(slot, item);
            this.revertedInventoryMap.set(item.id, slot);
            this.itemSetForDupeCheckInventory.add(item.id);
            this.itemsInInventory++;
        }
    }
    _removeItemFromInventory(item) {
        if (this.itemsInInventory === 0) {
            return false;
        }
        else if (!this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else {
            const slot = this.revertedInventoryMap.get(item.id);
            this.inventory.delete(slot);
            this.revertedInventoryMap.delete(item.id);
            this.itemSetForDupeCheckInventory.delete(item.id);
            this.emptySlots.add(slot);
            this.itemsInInventory--;
        }

    }
    _equipItemFromInventory(item) {
        this.slot = item.slot;
        if (this.itemsInInventory === 0) {
            return false;
        }
        //if item is not in inventory return false
        else if (!this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else {//equip item, remove from inventory, add to equipped
            const slot = this.revertedInventoryMap.get(item.id);
            this.equipped.set(this.slot, item);
            this.itemSetForDupeCheckEquipped.add(item.id);
            this.itemSetForDupeCheckInventory.delete(item.id);
            this.inventory.delete(slot);
            this.revertedInventoryMap.delete(item.id);
            this.emptySlots.add(slot);
            this.itemsInInventory--;
        }


    }
    _removeItemFromEquipped(item) {
        this.slot = item.slot;
        //if equipped is empty return false
        if (this.itemSetForDupeCheckEquipped.size === 0) {
            return false;
        }
        //if item is not in equipped
        else if (!this.itemSetForDupeCheckEquipped.has(item.id)) {
            return false;
        }
        else {
            const slot = this.emptySlots.values().next().value;
            this.emptySlots.delete(slot);
            this.equipped.set(this.slot, null);
            this.itemSetForDupeCheckEquipped.delete(item.id);
            this.inventory.set(slot, item);
            this.revertedInventoryMap.set(item.id, slot);
            this.itemSetForDupeCheckInventory.add(item.id);
            this.itemsInInventory++;
        }

    }


    /** Shows the panel and resets the preview so no stale item is displayed. */
    show() {
        
        this.inventoryPanel.setVisible(true);
       
    }

    /** Hides the entire shop panel. */
    hide() { this.inventoryPanel.setVisible(false); }

    /** Toggles the panel open/closed. */
    toggle() {
        if (this.inventoryPanel.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
