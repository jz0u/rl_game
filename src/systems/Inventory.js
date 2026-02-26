import { INVENTORY_SIZE } from '../config/constants';

export default class Inventory {
    constructor() {
        this.inventoryItemIds = new Set();
        this.equippedItemIds = new Set();
        this.inventoryCount = 0;

        this.inventory = new Map();
        this.equipped = new Map();

        this.equipped.set('head', null);
        this.equipped.set('body', null);
        this.equipped.set('bottom', null);
        this.equipped.set('feet', null);
        this.equipped.set('weapon', null);
        this.equipped.set('offhand', null);

        this.itemSlotMap = new Map();
        this.emptySlots = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]);
    }

    /**
     * Adds an item to the first available inventory slot.
     * Fails silently if the inventory is full or the item is already present in inventory or equipped.
     * @param {{ id: string, slot: string }} item - The item to add.
     * @returns {false|undefined} Returns false if the item could not be added.
     */
    addItemToInventory(item) {
        if (this.inventoryCount >= INVENTORY_SIZE) {
            return false;
        }
        else if (this.inventoryItemIds.has(item.id)) {
            return false;
        }
        else if (this.equippedItemIds.has(item.id)) {
            return false;
        }
        else {
            const slot = Math.min(...this.emptySlots);
            this.emptySlots.delete(slot);
            this.inventory.set(slot, item);
            this.itemSlotMap.set(item.id, slot);
            this.inventoryItemIds.add(item.id);
            this.inventoryCount++;
        }
    }

    /**
     * Removes an item from the inventory and frees its slot.
     * Fails silently if the inventory is empty or the item is not present.
     * @param {{ id: string }} item - The item to remove.
     * @returns {false|undefined} Returns false if the item could not be removed.
     */
    removeItemFromInventory(item) {
        if (this.inventoryCount === 0) {
            return false;
        }
        else if (!this.inventoryItemIds.has(item.id)) {
            return false;
        }
        else {
            const slot = this.itemSlotMap.get(item.id);
            this.inventory.delete(slot);
            this.itemSlotMap.delete(item.id);
            this.inventoryItemIds.delete(item.id);
            this.emptySlots.add(slot);
            this.inventoryCount--;
        }
    }

    /**
     * Moves an item from the inventory into its corresponding equipment slot.
     * If the target slot is already occupied, the previous item is automatically
     * returned to inventory (inventoryCount net change is 0 for a swap, -1 for a fresh equip).
     * Fails silently if the inventory is empty or the item is not present.
     * Note: this method only manages data. Callers must also call player.equip(item)
     * separately to update the visual overlay on the player sprite.
     * @param {{ id: string, slot: string }} item - The item to equip.
     * @returns {false|undefined} Returns false if the item could not be equipped.
     */
    equipItemFromInventory(item) {
        const equipSlot = item.slot;
        if (this.inventoryCount === 0) {
            return false;
        }
        else if (!this.inventoryItemIds.has(item.id)) {
            return false;
        }
        else {
            // Block equipping an offhand while a two-handed weapon is in the weapon slot.
            if (item.slot === 'offhand') {
                const currentWeapon = this.equipped.get('weapon');
                if (currentWeapon !== null && currentWeapon.hands === 'two-handed') {
                    return false;
                }
            }

            const incomingSlot = this.itemSlotMap.get(item.id);
            const currentlyEquipped = this.equipped.get(equipSlot);

            if (currentlyEquipped !== null) {
                // Free the incoming item's inventory slot first so there is always
                // a home for the displaced item, even when the inventory is otherwise full.
                this.inventory.delete(incomingSlot);
                this.itemSlotMap.delete(item.id);
                this.inventoryItemIds.delete(item.id);
                this.emptySlots.add(incomingSlot);

                // Move the previously equipped item back into inventory.
                const returnSlot = Math.min(...this.emptySlots);
                this.emptySlots.delete(returnSlot);
                this.inventory.set(returnSlot, currentlyEquipped);
                this.itemSlotMap.set(currentlyEquipped.id, returnSlot);
                this.inventoryItemIds.add(currentlyEquipped.id);
                this.equippedItemIds.delete(currentlyEquipped.id);

                // inventoryCount: one item left (-1), one returned (+1) — net 0.
                this.equipped.set(equipSlot, item);
                this.equippedItemIds.add(item.id);
            } else {
                // Slot was empty — standard equip, inventory shrinks by one.
                this.equipped.set(equipSlot, item);
                this.equippedItemIds.add(item.id);
                this.inventoryItemIds.delete(item.id);
                this.inventory.delete(incomingSlot);
                this.itemSlotMap.delete(item.id);
                this.emptySlots.add(incomingSlot);
                this.inventoryCount--;
            }

            // After equipping a two-handed weapon, evict any offhand back to inventory.
            if (item.slot === 'weapon' && item.hands === 'two-handed') {
                const offhandItem = this.equipped.get('offhand');
                if (offhandItem !== null) {
                    const returnSlot = Math.min(...this.emptySlots);
                    this.emptySlots.delete(returnSlot);
                    this.equipped.set('offhand', null);
                    this.equippedItemIds.delete(offhandItem.id);
                    this.inventory.set(returnSlot, offhandItem);
                    this.itemSlotMap.set(offhandItem.id, returnSlot);
                    this.inventoryItemIds.add(offhandItem.id);
                    this.inventoryCount++;
                }
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
        if (this.equippedItemIds.size === 0) {
            return false;
        }
        else if (!this.equippedItemIds.has(item.id)) {
            return false;
        }
        else {
            if (this.inventoryCount >= INVENTORY_SIZE) {
                return false;
            }
            const slot = Math.min(...this.emptySlots);
            this.emptySlots.delete(slot);
            this.equipped.set(equipSlot, null);
            this.equippedItemIds.delete(item.id);
            this.inventory.set(slot, item);
            this.itemSlotMap.set(item.id, slot);
            this.inventoryItemIds.add(item.id);
            this.inventoryCount++;
        }
    }
}
