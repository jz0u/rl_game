import Phaser from 'phaser'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: {
    preload() {},
    create() {
      this.add.text(400, 300, 'Phaser is working!', {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5)
    },
    update() {}
  }
}

new Phaser.Game(config)