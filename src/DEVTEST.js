// DEV ONLY — remove this file and its import in main.js before shipping.

export function DEVTEST_INVENTORY(inventory) {
    const testItem = { id: 'sword_01', name: 'Iron Sword', slot: 'weapon' };

    inventory.addItemToInventory(testItem);
    console.log('--- added item to inventory ---');
    console.log('inventory map:', [...inventory.inventory]);
    console.log('items in inventory:', inventory.itemsInInventory);
    console.log('empty slots:', [...inventory.emptySlots]);

    inventory.equipItemFromInventory(testItem);
    console.log('--- equipped item from inventory ---');
    console.log('equipped weapon:', inventory.equipped.get('weapon'));
    console.log('items in inventory:', inventory.itemsInInventory);

    inventory.removeItemFromEquipped(testItem);
    console.log('--- removed item from equipped ---');
    console.log('equipped weapon:', inventory.equipped.get('weapon'));
    console.log('inventory map:', [...inventory.inventory]);
    console.log('items in inventory:', inventory.itemsInInventory);

    // inventory.removeItemFromInventory(testItem);
    // console.log('--- removed item from inventory ---');
    // console.log('inventory map:', [...inventory.inventory]);
    // console.log('items in inventory:', inventory.itemsInInventory);
    // console.log('empty slots:', [...inventory.emptySlots]);
}
