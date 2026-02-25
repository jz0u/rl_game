/**
 * Registers keyboard shortcuts for the scene.
 *   ESC — close all open windows
 *   I   — open inventory
 *   P   — open shop
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function setupKeybinds(scene) {
    scene.input.keyboard.on('keydown-ESC', () => {
        scene.windowManager.closeAll();
    });

    scene.input.keyboard.on('keydown-I', () => {
        scene.windowManager.open(scene.inventoryWindow);
    });

    scene.input.keyboard.on('keydown-P', () => {
        scene.windowManager.open(scene.shop);
    });
}
