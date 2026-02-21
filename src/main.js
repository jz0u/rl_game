import Phaser from "phaser";
import Player from "./player";
const PLAYER_SPAWN_X = 500;
const PLAYER_SPAWN_Y = 500;
// A Scene is like a "screen" in your game.
// Every scene has 3 lifecycle methods Phaser calls automatically.
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" }); // give this scene a name
  }

  preload() {
    // Phaser calls this ONCE before the scene starts.
    Player.preload(this);
  }

  create() {
    // Phaser calls this ONCE after preload finishes.
    // This is where you build your scene — add objects, set up physics, etc.
    this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(this);
    this.input.mouse.disableContextMenu();
    this.input.on("pointerdown", (pointer) => {
      // pointer.x and pointer.y are where the click happened
      if (pointer.rightButtonDown()) {
        this.player.moveTo(pointer.x, pointer.y);
      } else if (pointer.leftButtonDown()) {
        this.player.attack(pointer.x);
      }
    });
  }

  update() {
    // Phaser calls this 60 times per second, forever.
    // This is your game loop — input, movement, collision checks all go here.
    this.player.update();
  }
}

// This is the Phaser game config — it tells Phaser how to set up the canvas.
new Phaser.Game({
  type: Phaser.AUTO, // let Phaser choose WebGL or Canvas renderer
  width: 1280,
  height: 720,
  backgroundColor: "#fff999",
  physics: {
    default: "arcade", // arcade physics = simple, fast, great for this game
    arcade: { gravity: { y: 0 } }, // no gravity — we're top-down
  },
  scene: [GameScene], // list of scenes to load
});
