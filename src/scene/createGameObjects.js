import Knight from "../entities/Knight";
import Goblin from "../entities/Goblin";
import { registerPlayerAnims, registerGoblinAnims } from './loadPlayerAssets';
import { goblin1 } from "../maps/goblin1";
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
    const tilemap = scene.make.tilemap({ key: goblin1.key });
    const tilesetImages = goblin1.tilesets.map(ts =>
        tilemap.addTilesetImage(ts.name, ts.name)
    );
    goblin1.layers.forEach((name, i) => {
        const isOverhead = i === goblin1.layers.length - 1;
        tilemap.createLayer(name, tilesetImages, 0, 0).setDepth(isOverhead ? 20 : i);
    });

    scene.collisionGroup = scene.physics.add.staticGroup();
    const collisionObjLayer = tilemap.getObjectLayer(goblin1.collisionLayer);
    if (collisionObjLayer) {
        for (const obj of collisionObjLayer.objects) {
            if (obj.polygon) {
                const pts = obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }));
                for (let i = 0; i < pts.length; i++) {
                    const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
                    const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
                    const w = Math.max(Math.abs(p2.x - p1.x), 8);
                    const h = Math.max(Math.abs(p2.y - p1.y), 8);
                    const rect = scene.add.rectangle(cx, cy, w, h);
                    scene.physics.add.existing(rect, true);
                    scene.collisionGroup.add(rect);
                }
            } else if (obj.width && obj.height) {
                const rect = scene.add.rectangle(
                    obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height
                );
                scene.physics.add.existing(rect, true);
                scene.collisionGroup.add(rect);
            }
        }
    }

    const playerObjLayer = tilemap.getObjectLayer('player');
    let playerX, playerY;
    if (playerObjLayer && playerObjLayer.objects.length > 0) {
        playerX = playerObjLayer.objects[0].x;
        playerY = playerObjLayer.objects[0].y;
    } else {
        playerX = tilemap.widthInPixels / 2;
        playerY = tilemap.heightInPixels / 2;
    }

    scene.knight = new Knight(scene, playerX, playerY);
    scene.knight.sprite.setDepth(10);
    scene.bank = new Bank(50);
    scene.coinDrops = [];
    scene.hud    = new HUD(scene, scene.knight);
    registerPlayerAnims(scene);
    registerGoblinAnims(scene);

    scene.cameras.main.setZoom(1);
    scene.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    scene.cameras.main.startFollow(scene.knight.sprite, true, 0.1, 0.1);

    scene.physics.add.collider(scene.knight.sprite, scene.collisionGroup);
    scene.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    scene.knight.sprite.setCollideWorldBounds(true);

    const goblinObjLayer = tilemap.getObjectLayer('goblin');
    if (goblinObjLayer && goblinObjLayer.objects.length > 0) {
        scene.goblins = goblinObjLayer.objects.map(obj => new Goblin(scene, obj.x, obj.y));
    } else {
        const W = tilemap.widthInPixels, H = tilemap.heightInPixels;
        scene.goblins = Array.from({ length: 5 }, () =>
            new Goblin(scene, Phaser.Math.Between(100, W - 100), Phaser.Math.Between(100, H - 100))
        );
    }
    scene.goblins.forEach(g => {
        g.sprite.setDepth(10);
        scene.physics.add.collider(g.sprite, scene.collisionGroup);
    });

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
