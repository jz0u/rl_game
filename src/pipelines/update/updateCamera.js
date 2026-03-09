export function updateCamera(scene) {
    scene.cameras.main.setScroll(
        Math.round(scene.cameras.main.scrollX),
        Math.round(scene.cameras.main.scrollY),
    );
}
