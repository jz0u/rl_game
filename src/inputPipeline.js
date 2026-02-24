/**
 * Registers all pointer input handlers for the scene.
 * Right-click moves the player; left-click triggers an attack.
 * Both actions are suppressed when the shop panel is open or a UI element is under the cursor.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
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