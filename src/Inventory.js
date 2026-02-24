export default class Inventory {
    constructor() {
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
    }

    /**
     * Adds an item to the first available inventory slot.
     * Fails silently if the inventory is full or the item is already present.
     * @param {{ id: string, slot: string }} item - The item to add.
     * @returns {false|undefined} Returns false if the item could not be added.
     */
    addItemToInventory(item) {
        if (this.itemsInInventory >= this.INVENTORYSIZE) {
            return false;
        }
        else if (this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else {
            const slot = this.emptySlots.values().next().value;
            this.emptySlots.delete(slot);
            this.inventory.set(slot, item);
            this.revertedInventoryMap.set(item.id, slot);
            this.itemSetForDupeCheckInventory.add(item.id);
            this.itemsInInventory++;
        }
    }

    /**
     * Removes an item from the inventory and frees its slot.
     * Fails silently if the inventory is empty or the item is not present.
     * @param {{ id: string }} item - The item to remove.
     * @returns {false|undefined} Returns false if the item could not be removed.
     */
    removeItemFromInventory(item) {
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

    /**
     * Moves an item from the inventory into its corresponding equipment slot.
     * Fails silently if the inventory is empty or the item is not present.
     * @param {{ id: string, slot: string }} item - The item to equip.
     * @returns {false|undefined} Returns false if the item could not be equipped.
     */
    equipItemFromInventory(item) {
        const equipSlot = item.slot;
        if (this.itemsInInventory === 0) {
            return false;
        }
        else if (!this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else {
            const slot = this.revertedInventoryMap.get(item.id);
            this.equipped.set(equipSlot, item);
            this.itemSetForDupeCheckEquipped.add(item.id);
            this.itemSetForDupeCheckInventory.delete(item.id);
            this.inventory.delete(slot);
            this.revertedInventoryMap.delete(item.id);
            this.emptySlots.add(slot);
            this.itemsInInventory--;
        }
    }

    /**
     * Moves an item from the equipped map back into the inventory.
     * Fails silently if nothing is equipped or the item is not found.
     * @param {{ id: string, slot: string }} item - The item to unequip.
     * @returns {false|undefined} Returns false if the item could not be unequipped.
     */
    removeItemFromEquipped(item) {
        const equipSlot = item.slot;
        if (this.itemSetForDupeCheckEquipped.size === 0) {
            return false;
        }
        else if (!this.itemSetForDupeCheckEquipped.has(item.id)) {
            return false;
        }
        else {
            const slot = this.emptySlots.values().next().value;
            this.emptySlots.delete(slot);
            this.equipped.set(equipSlot, null);
            this.itemSetForDupeCheckEquipped.delete(item.id);
            this.inventory.set(slot, item);
            this.revertedInventoryMap.set(item.id, slot);
            this.itemSetForDupeCheckInventory.add(item.id);
            this.itemsInInventory++;
        }
    }
}
