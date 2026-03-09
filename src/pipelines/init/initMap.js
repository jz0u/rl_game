import { goblin1 } from '../../maps/goblin1';

function createMapLayers(scene, tilemap, mapDef) {
    const tilesetImages = mapDef.tilesets.map(ts =>
        tilemap.addTilesetImage(ts.name, ts.name)
    );
    mapDef.layers.forEach((name, i) => {
        const isOverhead = mapDef.overheadLayers?.includes(name) ?? false;
        tilemap.createLayer(name, tilesetImages, 0, 0).setDepth(isOverhead ? 20 : i);
    });
}

export function initMap(scene) {
    const tilemap = scene.make.tilemap({ key: goblin1.key });
    createMapLayers(scene, tilemap, goblin1);
    scene.tilemap = tilemap;
    scene.collisionGroup = scene.physics.add.staticGroup();
    scene.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
}
