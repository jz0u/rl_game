import Phaser from 'phaser';
import levelManager from '../systems/LevelManager';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    this.add.text(width / 2, height / 2 - 80, '[ UNTITLED ]', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 40, 'PLAY', {
      fontSize: '32px',
      color: '#ffff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerup',   () => levelManager.advance());
    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#ffff00'));
  }
}
