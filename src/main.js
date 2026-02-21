import Phaser from 'phaser'

// A Scene is like a "screen" in your game.
// Every scene has 3 lifecycle methods Phaser calls automatically.
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' }) // give this scene a name
  }

  preload() {
    // Phaser calls this ONCE before the scene starts.
    // This is where you load images, audio, etc.
    // We have nothing to load yet.
  }

  create() {
    // Phaser calls this ONCE after preload finishes.
    // This is where you build your scene — add objects, set up physics, etc.
    
  }

  update() {
    // Phaser calls this 60 times per second, forever.
    // This is your game loop — input, movement, collision checks all go here.
  }
}

// This is the Phaser game config — it tells Phaser how to set up the canvas.
new Phaser.Game({
  type: Phaser.AUTO,       // let Phaser choose WebGL or Canvas renderer
  width: 1024,
  height: 1024,
  backgroundColor: '#111122',
  physics: {
    default: 'arcade',     // arcade physics = simple, fast, great for this game
    arcade: { gravity: { y: 0 } } // no gravity — we're top-down
  },
  scene: [GameScene]       // list of scenes to load
})