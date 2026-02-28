export default class GameActions {
    constructor({ player, inventory, equipmentManager, windowManager, inventoryPanel, shopPanel }) {
        this.player           = player;
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

    // Movement / combat — player.attack takes a single x coordinate
    moveTo(x, y)       { this.player.moveTo(x, y); }
    attack(x)          { this.player.attack(x); }

    // Combat — called by enemies
    damagePlayer(amount, attackerX)   { return this.player.takeDamage(amount, 'physical', attackerX); }
    getPlayerPosition()    { return { x: this.player.sprite.x, y: this.player.sprite.y }; }
    getPlayerSprite()      { return this.player.sprite; }

    // Inventory
    addItem(item)      { return this.inventory.addItemToInventory(item); }
}
