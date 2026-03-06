import Knight from "../entities/Knight";
import { registerPlayerAnims } from './loadPlayerAssets';
import MapManager from "../maps/MapManager";
import { map1 } from "../maps/map2";
import Shop from "../systems/Shop";
import ShopPanel from "../ui/ShopPanel";
import Inventory from "../systems/Inventory";
import InventoryPanel from "../ui/InventoryPanel";
import WindowManager from "../ui/WindowManager";
import EquipmentManager from "../systems/EquipmentManager";
import GameActions from "../systems/GameActions";
import Bank from "../systems/Bank";
import CursorUI from "../ui/CursorUI";
import HUD from "../ui/HUD";

/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    const map = MapManager.create(scene, map1);

    const playerX = 1024;
    const playerY = 1024;

    scene.knight = new Knight(scene, playerX, playerY);
    scene.knight.sprite.setDepth(10);
    scene.bank = new Bank(50);
    scene.coinDrops = [];
    scene.hud    = new HUD(scene, scene.knight);
    registerPlayerAnims(scene);

    scene.cameras.main.setZoom(1);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.knight.sprite, true, 0.1, 0.1);

    scene.physics.add.collider(scene.knight.sprite, scene.collisionGroup);
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.knight.sprite.setCollideWorldBounds(true);

    scene.shop             = new Shop();
    scene.shopPanel        = new ShopPanel(scene, allItems);
    scene.inventory        = new Inventory();
    scene.equipmentManager = new EquipmentManager(scene.inventory, scene.knight, scene);
    scene.inventoryPanel   = new InventoryPanel(scene, scene.inventory, allItems);
    scene.windowManager    = new WindowManager(scene);

    scene.equipmentManager.on('equipmentChanged', (equippedMap) => {
      scene.knight.syncEquipment(equippedMap);
      scene.knight.recomputeStats(equippedMap);
      if (scene.inventoryPanel.invPanel.visible) {
        scene.inventoryPanel._refresh();
      }
    });
    scene.windowManager.addWindow(scene.shopPanel);
    scene.windowManager.addWindow(scene.inventoryPanel);

    scene.actions = new GameActions({
        knight:           scene.knight,
        inventory:        scene.inventory,
        equipmentManager: scene.equipmentManager,
        windowManager:    scene.windowManager,
        inventoryPanel:   scene.inventoryPanel,
        shopPanel:        scene.shopPanel,
        bank:             scene.bank,
    });

    scene.cursorUI = new CursorUI(scene);
}
