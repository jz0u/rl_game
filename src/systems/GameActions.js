export default class GameActions {
    constructor({ knight, inventory, equipmentManager, windowManager, inventoryPanel, shopPanel, bank }) {
        this.knight           = knight;
        this.inventory        = inventory;
        this.equipmentManager = equipmentManager;
        this.windowManager    = windowManager;
        this.inventoryPanel   = inventoryPanel;
        this.shopPanel        = shopPanel;
        this.bank             = bank;
    }

    // Windows
    toggleInventory()  { this.windowManager.toggle(this.inventoryPanel); }
    toggleShop()       { this.windowManager.toggle(this.shopPanel); }
    closeAll()         { this.windowManager.closeAll(); }

    // Equipment
    equipItem(item)    { return this.equipmentManager.equip(item); }
    unequipSlot(slot)  { return this.equipmentManager.unequip(slot); }
    buyItem(item) {
        if (!this.bank?.canAfford(item.value)) return false;
        const result = this.equipmentManager.buy(item);
        if (result !== false) this.bank.withdraw(item.value);
        return result;
    }

    // Movement / combat — called by input.js
    moveTo(x, y)       { this.knight.moveTo(x, y); }
    attack(x)          { this.knight.attack(x); }

    // Combat — position / damage queries used by Goblin AI
    getKnightPosition()         { return { x: this.knight.sprite.x, y: this.knight.sprite.y }; }
    getKnightSprite()           { return this.knight.sprite; }
    damageKnight(amount, atX, guardDamage = 10) { return this.knight.takeDamage(amount, 'physical', atX, guardDamage); }

    // Inventory
    addItem(item)      { return this.inventory.addItemToInventory(item); }
}
