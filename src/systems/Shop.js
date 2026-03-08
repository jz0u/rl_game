export default class Shop {
    buy(item, player, inventory) {
        return inventory.addItemToInventory(item);
    }
}
