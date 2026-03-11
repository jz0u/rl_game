export function updateEnemies(scene) {
    scene.goblins?.forEach(g => { if (!g.isDead()) g.update(); });
}
