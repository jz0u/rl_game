export default class MapManager {
    static load(scene, mapDef) {
        scene.load.image(mapDef.imageBase, `assets/maps/1/${mapDef.imageBase}.png`);
        scene.load.image(mapDef.imageOverhead, `assets/maps/1/${mapDef.imageOverhead}.png`);
        scene.load.xml(mapDef.key, mapDef.tilemapPath);
    }

    static create(scene, mapDef) {
        scene.add.image(0, 0, mapDef.imageBase).setOrigin(0, 0).setDepth(0);
        scene.add.image(0, 0, mapDef.imageOverhead).setOrigin(0, 0).setDepth(20);

        const physicsGroup = scene.physics.add.staticGroup();
        scene[`${mapDef.collisionLayer}Group`] = physicsGroup;

        const xmlDoc = scene.cache.xml.get(mapDef.key);
        const objectGroups = xmlDoc.getElementsByTagName('objectgroup');
        for (const og of objectGroups) {
            if (og.getAttribute('name') !== mapDef.collisionLayer) continue;
            for (const obj of og.getElementsByTagName('object')) {
                const ox = parseFloat(obj.getAttribute('x'));
                const oy = parseFloat(obj.getAttribute('y'));
                const polygon = obj.querySelector('polygon');
                if (!polygon) {
                    // rectangle object
                    const w = parseFloat(obj.getAttribute('width'));
                    const h = parseFloat(obj.getAttribute('height'));
                    if (w && h) {
                        const rect = scene.add.rectangle(ox + w / 2, oy + h / 2, w, h);
                        scene.physics.add.existing(rect, true);
                        physicsGroup.add(rect);
                    }
                    continue;
                }
                // polygon: one AABB rect per edge
                const points = polygon.getAttribute('points').split(' ').map(p => {
                    const [px, py] = p.split(',').map(Number);
                    return { x: ox + px, y: oy + py };
                });
                for (let i = 0; i < points.length; i++) {
                    const p1 = points[i];
                    const p2 = points[(i + 1) % points.length];
                    const cx = (p1.x + p2.x) / 2;
                    const cy = (p1.y + p2.y) / 2;
                    const w = Math.max(Math.abs(p2.x - p1.x), 8);
                    const h = Math.max(Math.abs(p2.y - p1.y), 8);
                    const rect = scene.add.rectangle(cx, cy, w, h);
                    scene.physics.add.existing(rect, true);
                    physicsGroup.add(rect);
                }
            }
        }

        scene.physics.world.setBounds(0, 0, mapDef.width, mapDef.height);
        return { widthInPixels: mapDef.width, heightInPixels: mapDef.height };
    }
}
