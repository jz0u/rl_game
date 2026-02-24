import Player from "./Player";
import Shop from "./Shop";
import Inventory from "./Inventory";

const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

export function createGameObjects(scene, allItems) {
    scene.shop      = new Shop(scene, allItems);
    scene.player    = new Player(scene, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(scene);
    scene.inventory = new Inventory();
}
