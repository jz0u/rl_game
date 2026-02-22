import Phaser from "phaser";
import Player from "./Player";
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
  const btn = this.add
    .text(20, 20, "ITEMS", {
      fontSize: "16px",
      backgroundColor: "#333",
      padding: { x: 10, y: 6 },
      color: "#fff",
    })
    .setInteractive()
    .setScrollFactor(0);

  const panel = this.add.container(0, 0).setScrollFactor(0);

  const bg = this.add
    .rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      400,
      500,
      0x222222,
      0.9,
    )
    .setInteractive();

  const title = this.add
    .text(this.scale.width / 2, this.scale.height / 2 - 220, "Inventory", {
      fontSize: "20px",
      color: "#fff",
    })
    .setOrigin(0.5, 0);

  panel.add([bg, title]); // 👈 was missing
  panel.setVisible(false);
  panel.setDepth(10); // 👈 was missing

  btn.on("pointerdown", () => {
    panel.setVisible(!panel.visible); // 👈 toggle instead of just logging
  });

  this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
  Player.createAnims(this);
  this.input.mouse.disableContextMenu();
  this.input.on("pointerdown", (pointer) => {
    if (panel.visible) return; 
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
