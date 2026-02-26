import { GAME_WINDOW_CENTER, NAV_BTN_WIDTH, NAV_BTN_HEIGHT, DEPTH_UI_TOP } from './constants';

class WindowNode {
  constructor(windowInstance) {
    this.window = windowInstance;
    this.next   = null;
    this.prev   = null;
  }
}

export default class WindowManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene       = scene;
    this.head        = null;
    this.currentNode = null;

    this.leftPrevBtn = scene.add.image(183, GAME_WINDOW_CENTER.Y, 'prev_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(DEPTH_UI_TOP)
      .setVisible(false)
      .on('pointerdown', () => this.prev());

    this.leftNextBtn = scene.add.image(136, GAME_WINDOW_CENTER.Y, 'next_btn')
      .setDisplaySize(NAV_BTN_WIDTH, NAV_BTN_HEIGHT)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(DEPTH_UI_TOP)
      .setVisible(false)
      .on('pointerdown', () => this.next());
  }

  addWindow(windowInstance) {
    const node = new WindowNode(windowInstance);
    if (!this.head) {
      this.head  = node;
      node.next  = node;
      node.prev  = node;
    } else {
      const tail  = this.head.prev;
      tail.next   = node;
      node.prev   = tail;
      node.next   = this.head;
      this.head.prev = node;
    }
  }

  next() {
    if (!this.currentNode) return;
    this.currentNode.window.hide();
    this.currentNode = this.currentNode.next;
    this.currentNode.window.show();
    this._showArrows();
  }

  prev() {
    if (!this.currentNode) return;
    this.currentNode.window.hide();
    this.currentNode = this.currentNode.prev;
    this.currentNode.window.show();
    this._showArrows();
  }

  open(windowInstance) {
    if (!this.head) return;
    let node = this.head;
    do {
      if (node.window === windowInstance) break;
      node = node.next;
    } while (node !== this.head);
    if (node.window !== windowInstance) return;

    if (this.currentNode) this.currentNode.window.hide();
    this.currentNode = node;
    this.currentNode.window.show();
    this._showArrows();
  }

  closeAll() {
    if (this.currentNode) {
      this.currentNode.window.hide();
      this.currentNode = null;
    }
    this._hideArrows();
  }

  _showArrows() {
    this.leftPrevBtn.setVisible(true);
    this.leftNextBtn.setVisible(true);
  }

  _hideArrows() {
    this.leftPrevBtn.setVisible(false);
    this.leftNextBtn.setVisible(false);
  }
}
