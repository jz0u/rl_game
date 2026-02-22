import Phaser from "phaser";
import Player from "./Player";

// ─────────────────────────────────────────────
//  CONSTANTS
//  Put magic numbers here so they're easy to find and change later.
// ─────────────────────────────────────────────
const PLAYER_SPAWN_X = 200;
const PLAYER_SPAWN_Y = 200;

// ─────────────────────────────────────────────
//  GAME SCENE
//  A "Scene" is like one screen of your game (main menu, gameplay, etc).
//  Phaser calls three lifecycle methods automatically, in order:
//    preload() → create() → update() (60x per second)
// ─────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  // ── PRELOAD ──────────────────────────────────
  // Runs ONCE before the scene starts. Use it to load images, audio, etc.
  // Nothing should be drawn here — just loading assets into memory.
  preload() {
    Player.preload(this);
  }

  // ── CREATE ───────────────────────────────────
  // Runs ONCE after preload finishes. Set up your game objects here:
  // sprites, UI, animations, event listeners, cameras, etc.
  create() {
    // ── ITEMS BUTTON ──
    // A simple text object styled to look like a button.
    // setInteractive() makes Phaser listen for pointer (mouse/touch) events on it.
    // setScrollFactor(0) pins it to the screen so it doesn't move with the camera.
    const btn = this.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);
    /////////////////////////////////////////////////////////////
    // ── ITEMS PANEL ──
    // A Container groups multiple display objects so they move/hide together.
    // setScrollFactor(0) keeps it fixed to the screen (HUD-style).
    const shopPanel = this.add.container(0, 0).setScrollFactor(0);

    // The dark semi-transparent background rectangle for the shopPanel.
    // setInteractive() here "blocks" clicks from passing through to the game world.
    const shopWindow = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        1000,
        500,
        0x222222,
        0.9,
      )
      .setInteractive();
      //item preview
      const itemPreview = 
      this.add.rectangle(
        this.scale.width / 2 - 250,  // Width of the preview rectangle
        this.scale.height / 2,       // Height of the preview rectangle
        450,
        450,
        0x222222,                    // Color of the preview rectangle
        0.9,                         // Alpha value (opacity) of the preview rectangle
      );
      //item grid
      const itemGrid = 
      this.add.rectangle(
        this.scale.width / 2 + 250,
        this.scale.height / 2,
        450,
        450,
        0x222222,
        0.9,
      );
   
    shopPanel.add([shopWindow, itemPreview, itemGrid]);
    shopPanel.setVisible(false);
    // setDepth controls draw order — higher numbers appear on top.
    shopPanel.setDepth(10);

    // Toggle the shopPanel open/closed when the button is clicked.
    btn.on("pointerdown", () => {
      shopPanel.setVisible(!shopPanel.visible);
    });
    /////////////////////////////////////////////////////////////
    // ── PLAYER ──
    // Spawn the player at the defined coordinates and register all animations.
    this.player = new Player(this, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    Player.createAnims(this);

    this.player.equip({ slot: "weapon", animPrefix: "longsword" });

    // Disable the right-click context menu so we can use right-click to move.
    this.input.mouse.disableContextMenu();

    // ── INPUT ──
    // Listen for any pointer (mouse/touch) press anywhere in the scene.
    this.input.on("pointerdown", (pointer) => {
      // Clicks while the inventory shopPanel is open should not affect the game world.
      if (shopPanel.visible) return;

      if (pointer.rightButtonDown()) {
        this.player.moveTo(pointer.x, pointer.y);
      } else if (pointer.leftButtonDown()) {
        this.player.attack(pointer.x);
      }
    });
  }

  // ── UPDATE ───────────────────────────────────
  // Runs ~60 times per second. This is your game loop.
  // Keep this lean — movement, collision checks, AI ticks, etc.
  update() {
    this.player.update();
  }
}

// ─────────────────────────────────────────────
//  PHASER GAME CONFIG
//  Boots up the engine with these settings and kicks off GameScene.
// ─────────────────────────────────────────────
new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#fff999",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } },
  },
  scene: [GameScene],
});
