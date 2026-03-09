import { goblin1 } from '../../maps/goblin1';

export function loadMapAssets(scene) {
    scene.load.tilemapTiledJSON(goblin1.key, goblin1.tilemapPath);
    goblin1.tilesets.forEach(ts => scene.load.image(ts.name, ts.path));
}
