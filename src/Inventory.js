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

    _addItemToInventory(item) {
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
        else if (!this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else {
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
        if (this.itemSetForDupeCheckEquipped.size === 0) {
            return false;
        }
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
}
