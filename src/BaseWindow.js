import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER, PANEL_SCALE } from './constants';

/**
 * Base class for full-screen game windows (Shop, InventoryWindow, …).
 * Provides shared layout helpers for the panel container, background layers,
 * decorative left-pane rects, and the paperdoll image.
 */
export default class BaseWindow {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene        = scene;
    this.windowWidth  = GAME_WINDOW_WIDTH  * PANEL_SCALE;
    this.windowHeight = GAME_WINDOW_HEIGHT * PANEL_SCALE;
  }

  /** Creates and returns the root panel container. */
  _buildContainer() {
    return this.scene.add.container(0, 0).setScrollFactor(0);
  }

  /**
   * Adds the two-layer background (tinted rect + shop_panel image) to `container`.
   * @param {Phaser.GameObjects.Container} container
   */
  _buildBackground(container) {
    const bgRect = this.scene.add.rectangle(
      GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y,
      this.windowWidth - 7, this.windowHeight - 7,
      0xdbc8a8,
    ).setAlpha(0.1);

    const shopWindow = this.scene.add.image(
      GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'shop_panel',
    )
      .setDisplaySize(this.windowWidth + 100, this.windowHeight + 10)
      .setAlpha(0.8)
      .setInteractive();

    container.add([bgRect, shopWindow]);
  }

  /**
   * Adds the three decorative left-pane rects (hidden, kept for layout reference) to `container`.
   * @param {Phaser.GameObjects.Container} container
   */
  _buildLeftPaneRects(container) {
    const leftX = GAME_WINDOW_CENTER.X - this.windowWidth / 2;
    const topY  = GAME_WINDOW_CENTER.Y - this.windowHeight / 2;
    const paneW = this.windowWidth / 2;
    const paneH = this.windowHeight;
    const rectW = paneW / 3;

    for (let i = 0; i < 3; i++) {
      const rect = this.scene.add.graphics();
      rect.fillStyle(0x1a1a1a, 0.5);
      rect.fillRect(leftX + i * rectW, topY, rectW, paneH);
      rect.lineStyle(1, 0x8b6914, 0.8);
      rect.strokeRect(leftX + i * rectW, topY, rectW, paneH);
      rect.setAlpha(0); // DEV BOUNDS — hidden, keep for layout reference
      container.add(rect);
    }
  }

  /**
   * Creates `this.playerDoll`, adds it to `container`, and returns layout metrics.
   * @param {Phaser.GameObjects.Container} container
   * @returns {{ dollX: number, dollSize: number }}
   */
  _buildPaperdoll(container) {
    const dollSize = Math.min(this.windowWidth / 2, this.windowHeight);
    const dollX    = GAME_WINDOW_CENTER.X - this.windowWidth / 2 + this.windowWidth / 4;

    this.playerDoll = this.scene.add.image(dollX, GAME_WINDOW_CENTER.Y, 'player_paperdoll')
      .setDisplaySize(dollSize, dollSize);
    container.add(this.playerDoll);

    return { dollX, dollSize };
  }

  show()   {}
  hide()   {}
  toggle() {}
}
