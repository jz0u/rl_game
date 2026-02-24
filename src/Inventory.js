/** Maximum number of items the player can carry at once. */
const INVENTORY_SIZE = 10;

export default class Inventory {
    constructor() {
        this.itemSetForDupeCheckInventory = new Set();
        this.itemSetForDupeCheckEquipped = new Set();
        this.itemsInInventory = 0;

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
     * Fails silently if the inventory is full or the item is already present in inventory or equipped.
     * @param {{ id: string, slot: string }} item - The item to add.
     * @returns {false|undefined} Returns false if the item could not be added.
     */
    addItemToInventory(item) {
        if (this.itemsInInventory >= INVENTORY_SIZE) {
            return false;
        }
        else if (this.itemSetForDupeCheckInventory.has(item.id)) {
            return false;
        }
        else if (this.itemSetForDupeCheckEquipped.has(item.id)) {
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
     * If the target slot is already occupied, the previous item is automatically
     * returned to inventory (itemsInInventory net change is 0 for a swap, -1 for a fresh equip).
     * Fails silently if the inventory is empty or the item is not present.
     * Note: this method only manages data. Callers must also call player.equip(item)
     * separately to update the visual overlay on the player sprite.
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
            const incomingSlot = this.revertedInventoryMap.get(item.id);
            const currentlyEquipped = this.equipped.get(equipSlot);

            if (currentlyEquipped !== null) {
                // Free the incoming item's inventory slot first so there is always
                // a home for the displaced item, even when the inventory is otherwise full.
                this.inventory.delete(incomingSlot);
                this.revertedInventoryMap.delete(item.id);
                this.itemSetForDupeCheckInventory.delete(item.id);
                this.emptySlots.add(incomingSlot);

                // Move the previously equipped item back into inventory.
                const returnSlot = this.emptySlots.values().next().value;
                this.emptySlots.delete(returnSlot);
                this.inventory.set(returnSlot, currentlyEquipped);
                this.revertedInventoryMap.set(currentlyEquipped.id, returnSlot);
                this.itemSetForDupeCheckInventory.add(currentlyEquipped.id);
                this.itemSetForDupeCheckEquipped.delete(currentlyEquipped.id);

                // itemsInInventory: one item left (-1), one returned (+1) — net 0.
                this.equipped.set(equipSlot, item);
                this.itemSetForDupeCheckEquipped.add(item.id);
            } else {
                // Slot was empty — standard equip, inventory shrinks by one.
                this.equipped.set(equipSlot, item);
                this.itemSetForDupeCheckEquipped.add(item.id);
                this.itemSetForDupeCheckInventory.delete(item.id);
                this.inventory.delete(incomingSlot);
                this.revertedInventoryMap.delete(item.id);
                this.emptySlots.add(incomingSlot);
                this.itemsInInventory--;
            }
        }
    }

    /**
     * Moves an item from the equipped map back into the inventory.
     * Fails silently if nothing is equipped, the item is not found, or the inventory is full.
     * @param {{ id: string, slot: string }} item - The item to unequip.
     * @returns {false|undefined} Returns false if the item could not be unequipped.
     *   Also returns false if the inventory is full.
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
            if (this.itemsInInventory >= INVENTORY_SIZE) {
                return false;
            }
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
