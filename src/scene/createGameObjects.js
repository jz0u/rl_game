import Knight from "../entities/Knight";
import Goblin from "../entities/Goblin";
import { registerPlayerAnims, registerGoblinAnims } from './loadPlayerAssets';
import MapManager from "../maps/MapManager";
import { map2 } from "../maps/map2";
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

const GOBLIN_COUNT    = 20;
const MIN_SPAWN_DIST  = 200;  // minimum px from knight start position

/**
 * Returns a random spawn position within map bounds that is at least
 * MIN_SPAWN_DIST pixels away from (cx, cy).
 */
function randomSpawn(cx, cy, mapW, mapH, rng = Math) {
  let x, y;
  do {
    x = rng.random() * mapW;
    y = rng.random() * mapH;
  } while (Math.hypot(x - cx, y - cy) < MIN_SPAWN_DIST);
  return { x, y };
}

/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    const map = MapManager.create(scene, map2);

    const playerX = map.widthInPixels  / 2;
    const playerY = map.heightInPixels / 2;

    scene.knight = new Knight(scene, playerX, playerY);
    scene.bank = new Bank(50);
    scene.coinDrops = [];
    scene.hud    = new HUD(scene, scene.knight);
    registerPlayerAnims(scene);
    registerGoblinAnims(scene);

    scene.cameras.main.setZoom(1);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.knight.sprite, true, 0.1, 0.1);

    // Spawn 20 goblins scattered across the map, away from the knight.
    scene.goblins = [];
    for (let i = 0; i < GOBLIN_COUNT; i++) {
        const { x, y } = randomSpawn(playerX, playerY, map.widthInPixels, map.heightInPixels);
        scene.goblins.push(new Goblin(scene, x, y));
    }

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
