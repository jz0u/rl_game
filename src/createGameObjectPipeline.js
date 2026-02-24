import Player from "./Player";
import Shop from "./Shop";
import Inventory from "./Inventory";

const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

/**
 * Instantiates the core game objects and attaches them to the scene.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 * @param {object[]} allItems - Full item catalogue from Armory (all slots combined).
 */
export function createGameObjects(scene, allItems) {
    scene.player    = new Player(scene, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(scene);
    scene.shop      = new Shop(scene, allItems);
    scene.inventory = new Inventory();
}
