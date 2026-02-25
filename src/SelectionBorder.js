import { CELL_SIZE } from './constants';

const THEMES = {
  buy:   ['border_selected1', 'border_selected2', 'border_selected3'],
  equip: ['blue_selected1',   'blue_selected2',   'blue_selected3'],
  drop:  ['red_selected1',    'red_selected2',    'red_selected3'],
};

/**
 * Owns the triple-click selection border progression used by Shop and InventoryWindow.
 * Tracks which item is selected and how many times it has been clicked.
 * On the third click, calls the supplied `onConfirm` callback then resets.
 */
export default class SelectionBorder {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.Container} container - Panel container to add the border to.
   */
  constructor(scene, container) {
    this.scene          = scene;
    this.selectedItem   = null;
    this.selectedClicks = 0;
    this.border = scene.add.image(0, 0, 'border_selected1')
      .setDisplaySize(CELL_SIZE, CELL_SIZE)
      .setVisible(false)
      .setScrollFactor(0);
    container.add(this.border);
  }

  /**
   * Advances the selection state for the given item at position (x, y).
   * Click 1 — new item selected, border appears.
   * Click 2 — second confirmation, border changes texture.
   * Click 3+ — final confirmation, `onConfirm` is called, state resets.
   * @param {object} item
   * @param {number} x
   * @param {number} y
   * @param {Function} onConfirm - Return false to signal failure (shows error texture).
   * @param {'buy'|'equip'|'drop'} theme
   */
  advance(item, x, y, onConfirm, theme = 'buy') {
    const [t1, t2, t3] = THEMES[theme] ?? THEMES.buy;

    if (this.selectedItem !== item) {
      this.selectedItem   = item;
      this.selectedClicks = 1;
      this.border
        .setTexture(t1)
        .setPosition(x, y)
        .setVisible(true);
    } else {
      this.selectedClicks++;
      if (this.selectedClicks === 2) {
        this.border.setTexture(t2);
      } else if (this.selectedClicks >= 3) {
        const result = onConfirm();
        if (result === false) {
          this.border.setTexture('border_selected_err');
          this.scene.time.delayedCall(600, () => this.reset());
        } else {
          this.border.setTexture(t3);
          this.scene.time.delayedCall(300, () => this.reset());
        }
      }
    }
  }

  /** Clears selection state and hides the border. */
  reset() {
    this.selectedItem   = null;
    this.selectedClicks = 0;
    this.border.setVisible(false);
  }
}
