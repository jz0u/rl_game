import Knight from "../entities/Knight";
import { registerPlayerAnims } from './loadPlayerAssets';
import { goblin1 } from "../maps/goblin1";
import { CAMERA_ZOOM } from '../config/constants';
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

function createMapLayers(scene, tilemap, mapDef) {
    const tilesetImages = mapDef.tilesets.map(ts =>
        tilemap.addTilesetImage(ts.name, ts.name)
    );
    mapDef.layers.forEach((name, i) => {
        const isOverhead = mapDef.overheadLayers?.includes(name) ?? false;
        tilemap.createLayer(name, tilesetImages, 0, 0).setDepth(isOverhead ? 20 : i);
    });
}

/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    const tilemap = scene.make.tilemap({ key: goblin1.key });
    createMapLayers(scene, tilemap, goblin1);

    scene.collisionGroup = scene.physics.add.staticGroup();

    const playerX = tilemap.widthInPixels / 2;
    const playerY = tilemap.heightInPixels / 2;

    scene.knight = new Knight(scene, playerX, playerY);
    scene.knight.sprite.setDepth(10);
    scene.bank = new Bank(50);
    scene.coinDrops = [];
    scene.hud    = new HUD(scene, scene.knight);
    registerPlayerAnims(scene);

    scene.cameras.main.setZoom(CAMERA_ZOOM);
    scene.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    scene.cameras.main.startFollow(scene.knight.sprite, true, 0.1, 0.1);

    scene.physics.add.collider(scene.knight.sprite, scene.collisionGroup);
    scene.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    scene.knight.sprite.setCollideWorldBounds(true);

    scene.goblins = [];

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
