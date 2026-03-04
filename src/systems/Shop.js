export default class Shop {
    buy(item, player, inventory) {
        const result = inventory.addItemToInventory(item);
        if (result === false) return false;
        return true;
    }
}
