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

        const objectLayer = map.getObjectLayer(mapDef.collisionLayer);
        const collisionGroup = scene.physics.add.staticGroup();
        objectLayer.objects.forEach(obj => {
            const rect = scene.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height
            );
            scene.physics.add.existing(rect, true);
            collisionGroup.add(rect);
        });
        scene[`${mapDef.collisionLayer}Group`] = collisionGroup;

        return map;
    }
}
