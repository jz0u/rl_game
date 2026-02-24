export function setupInput(scene) {
    scene.input.mouse.disableContextMenu();

    scene.input.on("pointerdown", (pointer, currentlyOver) => {
        if (currentlyOver.length > 0) return;
        if (scene.shop.shopPanel.visible) return;

        if (pointer.rightButtonDown()) {
            scene.player.moveTo(pointer.x, pointer.y);
        } else if (pointer.leftButtonDown()) {
            scene.player.attack(pointer.x);
        }
    });
}