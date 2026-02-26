/**
 * Registers all pointer input handlers for the scene.
 * Right-click moves the player; left-click triggers an attack.
 * Both actions are suppressed when the shop panel is open or a UI element is under the cursor.
 * Pointer coordinates are converted to world-space (pointer.worldX/Y) before being passed to player methods.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function setupInput(scene) {
    scene.input.mouse.disableContextMenu();

    scene.input.on("pointerdown", (pointer, currentlyOver) => {
        // Suppress gameplay input when any UI panel is open or a UI element is hovered
        if (currentlyOver.length > 0) return;
        if (scene.shopPanel.shopPanel.visible) return;
        if (scene.inventoryPanel.invPanel.visible) return;

        if (pointer.rightButtonDown()) {
            scene.player.moveTo(pointer.worldX, pointer.worldY);
        } else if (pointer.leftButtonDown()) {
            scene.player.attack(pointer.worldX);
        }
    });
}