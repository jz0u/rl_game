import { GAME_WINDOW_CENTER, GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, PANEL_SCALE } from '../config/constants.js';

/**
 * Registers all pointer input handlers for the scene.
 * Right-click moves the player; left-click triggers an attack.
 * Both actions are suppressed when the shop panel is open or a UI element is under the cursor.
 * Pointer coordinates are converted to world-space (pointer.worldX/Y) before being passed to player methods.
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function setupInput(scene) {
    scene.input.mouse.disableContextMenu();

    // Precompute panel bounds (screen-space, matches BasePanel layout)
    const halfW = (GAME_WINDOW_WIDTH * PANEL_SCALE) / 2;
    const halfH = (GAME_WINDOW_HEIGHT * PANEL_SCALE) / 2;
    const panelLeft   = GAME_WINDOW_CENTER.X - halfW;
    const panelRight  = GAME_WINDOW_CENTER.X + halfW;
    const panelTop    = GAME_WINDOW_CENTER.Y - halfH;
    const panelBottom = GAME_WINDOW_CENTER.Y + halfH;

    scene.input.on("pointerdown", (pointer, currentlyOver) => {
        // If a panel is open, use geometry to decide: inside → ignore, outside → close
        if (scene.shopPanel.shopPanel.visible || scene.inventoryPanel.invPanel.visible) {
            const outside =
                pointer.x < panelLeft  || pointer.x > panelRight ||
                pointer.y < panelTop   || pointer.y > panelBottom;
            if (outside) scene.actions.closeAll();
            return; // Never trigger gameplay while a panel was open
        }

        // No panel open — normal gameplay input
        if (currentlyOver.length > 0) return;

        if (pointer.rightButtonDown()) {
            scene.actions.moveTo(pointer.worldX, pointer.worldY);
        } else if (pointer.leftButtonDown()) {
            scene.actions.attack(pointer.worldX);
        }
    });
}
