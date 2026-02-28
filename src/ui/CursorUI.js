import { DEPTH_EFFECTS_TOP } from '../config/constants';

export default class CursorUI {
  constructor(scene) {
    this.scene = scene;
    this.label = scene.add.text(0, 0, '', {
      fontSize: '11px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#00000066',
      padding: { x: 4, y: 2 }
    }).setDepth(DEPTH_EFFECTS_TOP).setScrollFactor(0);
  }

  update() {
    const pointer = this.scene.input.activePointer;
    const worldX  = Math.floor(pointer.worldX);
    const worldY  = Math.floor(pointer.worldY);
    const screenX = Math.floor(pointer.x);
    const screenY = Math.floor(pointer.y);

    this.label.setText(`world: ${worldX}, ${worldY}\nscreen: ${screenX}, ${screenY}`);
    this.label.setPosition(screenX + 16, screenY + 16);

    const camW = this.scene.cameras.main.width;
    const camH = this.scene.cameras.main.height;
    if (screenX + 16 + this.label.width  > camW) this.label.setX(screenX - this.label.width  - 4);
    if (screenY + 16 + this.label.height > camH) this.label.setY(screenY - this.label.height - 4);
  }
}
