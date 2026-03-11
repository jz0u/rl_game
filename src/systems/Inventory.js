import { INVENTORY_SIZE } from '../config/constants';

export default class Inventory {
    constructor() {
        this.inventoryItemIds = new Set();
        this.equippedItemIds = new Set();
        this.inventoryCount = 0;

        this.inventory = new Map();
        this.equipped = new Map();

        this.equipped.set('legs', null);
        this.equipped.set('feet', null);
        this.equipped.set('body_inner', null);
        this.equipped.set('body_outer', null);
        this.equipped.set('hands', null);
        this.equipped.set('shoulder', null);
        this.equipped.set('amulet', null);
        this.equipped.set('head', null);
        this.equipped.set('primary', null);
        this.equipped.set('secondary', null);

        this.itemSlotMap = new Map();
        this.emptySlots = new Set(Array.from({ length: INVENTORY_SIZE }, (_, i) => i + 1));
    }

    _takeFirstEmptySlot() {
        if (this.emptySlots.size === 0) return null;
        const slot = Math.min(...this.emptySlots);
        this.emptySlots.delete(slot);
        return slot;
    }

    /**
     * Adds an item to the first available inventory slot.
     * Fails silently if the inventory is full or the item is already present in inventory or equipped.
     * @param {{ id: string, equipSlot: string }} item - The item to add.
     * @returns {boolean} false if the item could not be added, true on success.
     */
    addItemToInventory(item) {
        if (this.inventoryCount >= INVENTORY_SIZE) return false;
        if (this.inventoryItemIds.has(item.id)) return false;
        if (this.equippedItemIds.has(item.id)) return false;
        const slot = this._takeFirstEmptySlot();
        if (slot === null) return false;
        this.inventory.set(slot, item);
        this.itemSlotMap.set(item.id, slot);
        this.inventoryItemIds.add(item.id);
        this.inventoryCount++;
        return true;
    }

    /**
     * Removes an item from the inventory and frees its slot.
     * Fails silently if the inventory is empty or the item is not present.
     * @param {{ id: string }} item - The item to remove.
     * @returns {boolean} false if the item could not be removed, true on success.
     */
    removeItemFromInventory(item) {
        if (this.inventoryCount === 0) return false;
        if (!this.inventoryItemIds.has(item.id)) return false;
        const slot = this.itemSlotMap.get(item.id);
        this.inventory.delete(slot);
        this.itemSlotMap.delete(item.id);
        this.inventoryItemIds.delete(item.id);
        this.emptySlots.add(slot);
        this.inventoryCount--;
        return true;
    }

    /**
     * Moves an item from the inventory into its corresponding equipment slot.
     * If the target slot is already occupied, the previous item is automatically
     * returned to inventory (inventoryCount net change is 0 for a swap, -1 for a fresh equip).
     * Fails silently if the inventory is empty or the item is not present.
     * Note: this method only manages data. Callers must also call player.equip(item)
     * separately to update the visual overlay on the player sprite.
     * @param {{ id: string, equipSlot: string }} item - The item to equip.
     * @returns {boolean} false if the item could not be equipped, true on success.
     */
    equipItemFromInventory(item) {
        const equipSlot = item.equipSlot;
        if (this.inventoryCount === 0) return false;
        if (!this.inventoryItemIds.has(item.id)) return false;
        // Block equipping a secondary while a two-handed weapon is in the primary slot.
        if (item.equipSlot === 'secondary') {
            const currentWeapon = this.equipped.get('primary');
            if (currentWeapon !== null && currentWeapon.handType === 'two') return false;
        }

        const incomingSlot = this.itemSlotMap.get(item.id);
        const currentlyEquipped = this.equipped.get(equipSlot);
        const secondaryItem = this.equipped.get('secondary');

        if (
            item.equipSlot === 'primary' &&
            item.handType === 'two' &&
            currentlyEquipped !== null &&
            secondaryItem !== null &&
            this.emptySlots.size === 0
        ) {
            return false;
        }

        if (currentlyEquipped !== null) {
            // Free the incoming item's inventory slot first so there is always
            // a home for the displaced item, even when the inventory is otherwise full.
            this.inventory.delete(incomingSlot);
            this.itemSlotMap.delete(item.id);
            this.inventoryItemIds.delete(item.id);
            this.emptySlots.add(incomingSlot);

            // Move the previously equipped item back into inventory.
            const returnSlot = this._takeFirstEmptySlot();
            if (returnSlot === null) return false;
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

        // After equipping a two-handed weapon, evict any secondary back to inventory.
        if (item.equipSlot === 'primary' && item.handType === 'two') {
            if (secondaryItem !== null) {
                const returnSlot = this._takeFirstEmptySlot();
                if (returnSlot === null) return false;
                this.equipped.set('secondary', null);
                this.equippedItemIds.delete(secondaryItem.id);
                this.inventory.set(returnSlot, secondaryItem);
                this.itemSlotMap.set(secondaryItem.id, returnSlot);
                this.inventoryItemIds.add(secondaryItem.id);
                this.inventoryCount++;
            }
        }
        return true;
    }

    /**
     * Moves an item from the equipped map back into the inventory.
     * Fails silently if nothing is equipped, the item is not found, or the inventory is full.
     * @param {{ id: string, equipSlot: string }} item - The item to unequip.
     * @returns {boolean} false if the item could not be unequipped or inventory is full, true on success.
     */
    removeItemFromEquipped(item) {
        const equipSlot = item.equipSlot;
        if (this.equippedItemIds.size === 0) return false;
        if (!this.equippedItemIds.has(item.id)) return false;
        if (this.inventoryCount >= INVENTORY_SIZE) return false;
        const slot = this._takeFirstEmptySlot();
        if (slot === null) return false;
        this.equipped.set(equipSlot, null);
        this.equippedItemIds.delete(item.id);
        this.inventory.set(slot, item);
        this.itemSlotMap.set(item.id, slot);
        this.inventoryItemIds.add(item.id);
        this.inventoryCount++;
        return true;
    }
}
