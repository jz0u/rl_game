export default class GameActions {
    constructor({ knight, inventory, equipmentManager, windowManager, inventoryPanel, shopPanel }) {
        this.knight           = knight;
        this.inventory        = inventory;
        this.equipmentManager = equipmentManager;
        this.windowManager    = windowManager;
        this.inventoryPanel   = inventoryPanel;
        this.shopPanel        = shopPanel;
    }

    // Windows
    toggleInventory()  { this.windowManager.toggle(this.inventoryPanel); }
    toggleShop()       { this.windowManager.toggle(this.shopPanel); }
    closeAll()         { this.windowManager.closeAll(); }

    // Equipment
    equipItem(item)    { return this.equipmentManager.equip(item); }
    unequipSlot(slot)  { return this.equipmentManager.unequip(slot); }
    buyItem(item)      { return this.equipmentManager.buy(item); }

    // Movement / combat — called by input.js
    moveTo(x, y)       { this.knight.moveTo(x, y); }
    attack(x)          { this.knight.attack(x); }

    // Combat — position / damage queries used by Goblin AI
    getKnightPosition()         { return { x: this.knight.sprite.x, y: this.knight.sprite.y }; }
    getKnightSprite()           { return this.knight.sprite; }
    damageKnight(amount, atX)   { return this.knight.takeDamage(amount, 'physical', atX); }

    // Inventory
    addItem(item)      { return this.inventory.addItemToInventory(item); }
}
