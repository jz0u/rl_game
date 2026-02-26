import Player from "../Player";
import Shop from "../Shop";
import ShopPanel from "../ui/ShopPanel";
import Inventory from "../Inventory";
import InventoryPanel from "../ui/InventoryPanel";
import WindowManager from "../ui/WindowManager";


/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    // Build tilemap layers before the player so they render behind it
    const map = scene.make.tilemap({ key: 'map1' });
    const tilesetNames = [
        'Medieval_Underdeep_Tiles_1',
        'Medieval_Underdeep_Tiles_2',
        'Medieval_Underdeep_Tiles_4',
        'Medieval_Underdeep_Tiles_6',
        'Medieval_Underdeep_Tiles_7',
        'Medieval_Underdeep_Tiles_8',
        'Medieval_Underdeep_Tiles_9',
        'Medieval_Underdeep_Tiles_10',
        'Medieval_Underdeep_Tiles_11',
        'Medieval_Underdeep_Tiles_13',
    ];
    const tilesets = tilesetNames.map(name => map.addTilesetImage(name, name));
    scene.bgLayer     = map.createLayer('bg',     tilesets, 0, 0);
    scene.groundLayer = map.createLayer('ground', tilesets, 0, 0);
    scene.wallLayer   = map.createLayer('wall',   tilesets, 0, 0);
    scene.wallLayer.setCollisionByExclusion([-1]);

    scene.player          = new Player(scene, map.widthInPixels / 2, map.heightInPixels / 2);
    Player.createAnims(scene);
    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.cameras.main.startFollow(scene.player.sprite);
    scene.shop            = new Shop();
    scene.shopPanel       = new ShopPanel(scene, allItems);
    scene.inventory       = new Inventory();
    scene.inventoryPanel  = new InventoryPanel(scene, scene.inventory, scene.player, allItems);
    scene.windowManager   = new WindowManager(scene);
    scene.windowManager.addWindow(scene.shopPanel);
    scene.windowManager.addWindow(scene.inventoryPanel);
}
