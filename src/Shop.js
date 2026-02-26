export default class Shop {
    buy(item, player, inventory) {
        if (player.balance < item.value) return false;

        const result = inventory.addItemToInventory(item);
        if (result === false) return false;

        player.balance -= item.value;
    }
}
