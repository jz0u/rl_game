import GameActions from '../../systems/GameActions';

export function initActions(scene) {
    scene.equipmentManager.on('equipmentChanged', (equippedMap) => {
        scene.knight.syncEquipment(equippedMap);
        scene.knight.recomputeStats(equippedMap);
        if (scene.inventoryPanel.invPanel.visible) {
            scene.inventoryPanel._refresh();
        }
    });

    scene.actions = new GameActions({
        knight:           scene.knight,
        inventory:        scene.inventory,
        equipmentManager: scene.equipmentManager,
        windowManager:    scene.windowManager,
        inventoryPanel:   scene.inventoryPanel,
        shopPanel:        scene.shopPanel,
        bank:             scene.bank,
    });
}
