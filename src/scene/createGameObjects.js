import Player from "../entities/Player";
import MapManager from "../maps/MapManager";
import { map2 } from "../maps/map2";
import Shop from "../systems/Shop";
import ShopPanel from "../ui/ShopPanel";
import Inventory from "../systems/Inventory";
import InventoryPanel from "../ui/InventoryPanel";
import WindowManager from "../ui/WindowManager";
import EquipmentManager from "../systems/EquipmentManager";
import GameActions from "../systems/GameActions";
import Dummy from "../entities/enemies/Dummy";
import CursorUI from "../ui/CursorUI";
import HUD from "../ui/HUD";


/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    const map = MapManager.create(scene, map2);

    const playerX = map.widthInPixels / 2;
    const playerY = map.heightInPixels / 2;
    scene.player          = new Player(scene, playerX, playerY);
    scene.hud             = new HUD(scene, scene.player);
    Player.createAnims(scene);
    scene.cameras.main.setZoom(1);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.player.sprite, true, 0.1, 0.1);
    scene.dummy           = new Dummy(scene, playerX + 200, playerY);
    scene.dummy2          = new Dummy(scene, playerX + 350, playerY);
    scene.physics.add.collider(scene.player.sprite, scene.collusionGroup);
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.player.sprite.setCollideWorldBounds(true);
    scene.shop             = new Shop();
    scene.shopPanel        = new ShopPanel(scene, allItems);
    scene.inventory        = new Inventory();
    scene.equipmentManager = new EquipmentManager(scene.inventory, scene.player, scene);
    scene.inventoryPanel   = new InventoryPanel(scene, scene.inventory, allItems);
    scene.windowManager    = new WindowManager(scene);

    scene.equipmentManager.on('equipmentChanged', (equippedMap) => {
      scene.player.syncEquipment(equippedMap);
      scene.player.recomputeStats(equippedMap);
      if (scene.inventoryPanel.invPanel.visible) {
        scene.inventoryPanel._refresh();
      }
    });
    scene.windowManager.addWindow(scene.shopPanel);
    scene.windowManager.addWindow(scene.inventoryPanel);

    scene.actions = new GameActions({
        player:           scene.player,
        inventory:        scene.inventory,
        equipmentManager: scene.equipmentManager,
        windowManager:    scene.windowManager,
        inventoryPanel:   scene.inventoryPanel,
        shopPanel:        scene.shopPanel,
    });

    scene.cursorUI = new CursorUI(scene);
}
