export default class MapManager {
    static load(scene, mapDef) {
        scene.load.tilemapTiledJSON(mapDef.key, mapDef.tilemapPath);
        mapDef.tilesets.forEach(ts => scene.load.image(ts.name, ts.path));
    }

    static create(scene, mapDef) {
        const map = scene.make.tilemap({ key: mapDef.key });
        const tilesets = mapDef.tilesets.map(ts => map.addTilesetImage(ts.name, ts.name));
        mapDef.layers.forEach(layerName => {
            scene[`${layerName}Layer`] = map.createLayer(layerName, tilesets, 0, 0);
        });
        scene[`${mapDef.collisionLayer}Layer`].setCollisionByExclusion([-1]);
        return map;
    }
}
