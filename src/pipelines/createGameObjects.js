import Player from "../entities/Player";
import MapManager from "../maps/MapManager";
import { map1 } from "../maps/map1";
import Shop from "../systems/Shop";
import ShopPanel from "../ui/ShopPanel";
import Inventory from "../systems/Inventory";
import InventoryPanel from "../ui/InventoryPanel";
import WindowManager from "../ui/WindowManager";
import EquipmentManager from "../systems/EquipmentManager";


/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    const map = MapManager.create(scene, map1);

    scene.player          = new Player(scene, map.widthInPixels / 2, map.heightInPixels / 2);
    Player.createAnims(scene);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.player.sprite);
    scene.shop             = new Shop();
    scene.shopPanel        = new ShopPanel(scene, allItems);
    scene.inventory        = new Inventory();
    scene.equipmentManager = new EquipmentManager(scene.inventory, scene.player, scene);
    scene.inventoryPanel   = new InventoryPanel(scene, scene.inventory, allItems);
    scene.windowManager    = new WindowManager(scene);

    scene.equipmentManager.on('equipmentChanged', (equippedMap) => {
      scene.player.syncEquipment(equippedMap);
      if (scene.inventoryPanel.invPanel.visible) {
        scene.inventoryPanel._refresh();
      }
    });
    scene.windowManager.addWindow(scene.shopPanel);
    scene.windowManager.addWindow(scene.inventoryPanel);
}
