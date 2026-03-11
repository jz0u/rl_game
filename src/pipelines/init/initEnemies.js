import { registerGoblinAnims } from '../../scene/loadPlayerAssets';

export function initEnemies(scene) {
    scene.goblins = [];
    registerGoblinAnims(scene);
}
