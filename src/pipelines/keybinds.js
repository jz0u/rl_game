/**
 * Registers keyboard shortcuts for the scene.
 *   ESC — close all open windows
 *   I   — toggle inventory
 *   P   — toggle shop
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function setupKeybinds(scene) {
    scene.input.keyboard.on('keydown-ESC', () => {
        scene.actions.closeAll();
    });

    scene.input.keyboard.on('keydown-I', () => {
        scene.actions.toggleInventory();
    });

    scene.input.keyboard.on('keydown-P', () => {
        scene.actions.toggleShop();
    });
}
