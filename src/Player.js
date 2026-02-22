import { Armory, getItemPaths } from "./Armory";

export default class Player {
  // ─────────────────────────────────────────────
  //  CONSTRUCTOR
  //  Called once when you do: new Player(scene, x, y)
  //  Sets up the sprite, overlay slots, movement state, and animation hooks.
  // ─────────────────────────────────────────────
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "player_idle1_diag");

    // Equipment overlay slots — each will hold a sprite layered on top of the player.
    // null means "nothing equipped" in that slot.
    this.overlays = {
      head: null,
      chest: null,
      bottom: null,
      feet: null,
      weapon: null,
      offhand: null,
    };

    this.destination = null;
    this.stats = { moveSpeed: 3 };

    // Flag to prevent queueing multiple attacks or moving during an attack animation.
    this.isAttacking = false;

    // When any animation finishes, check if it was an attack animation.
    // If so, clear the attacking flag and return to the correct idle pose.
    this.sprite.on("animationcomplete", () => {
      this.isAttacking = false;
      this.sprite.play(this.getIdleAnim());
    });
  }

  // ─────────────────────────────────────────────
  //  PRELOAD  (static = called on the class, not an instance)
  //  Loads all spritesheets the player and weapon items need.
  //  Must be called inside the Phaser scene's preload() method.
  // ─────────────────────────────────────────────
  static preload(scene) {
    const sheets = [
      { key: "player_idle1_diag",    path: "assets/player/Medieval_Warfare_Male_1_idle1_diag.png" },
      { key: "player_idle2_diag",    path: "assets/player/Medieval_Warfare_Male_1_idle2_diag.png" },
      { key: "player_walking_diag",  path: "assets/player/Medieval_Warfare_Male_1_walking_diag.png" },
      { key: "player_attack1",       path: "assets/player/Medieval_Warfare_Male_1_MVsv_alt_attack1.png" },
      { key: "player_attack2",       path: "assets/player/Medieval_Warfare_Male_1_MVsv_alt_attack2.png" },
    ];

    sheets.forEach((sheet) => {
      scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: 128, frameHeight: 128 });
    });

    Armory.weapon.forEach(item => {
      const paths = getItemPaths(item);
      scene.load.spritesheet(`${item.id}_idle`,    paths.idle,    { frameWidth: 128, frameHeight: 128 });
      scene.load.spritesheet(`${item.id}_walking`, paths.walking, { frameWidth: 128, frameHeight: 128 });
      scene.load.spritesheet(`${item.id}_attack1`, paths.attack1, { frameWidth: 128, frameHeight: 128 });
      scene.load.spritesheet(`${item.id}_attack2`, paths.attack2, { frameWidth: 128, frameHeight: 128 });
    });
  }

  // ─────────────────────────────────────────────
  //  MOVE TO
  //  Sets a destination point. The update() loop will walk the player there.
  // ─────────────────────────────────────────────
  moveTo(x, y) {
    this.destination = { x, y };
  }

  // ─────────────────────────────────────────────
  //  GET DIRECTION ANIM
  //  Converts a movement angle (radians) into one of four walk animation keys.
  //  The spritesheet has four diagonal directions: NE, SE, SW, NW.
  //
  //  Angle reference (Phaser uses standard math angles):
  //    -90° = up-right (NE)
  //      0° = right    (SE)
  //     90° = down     (SW)
  //    180° = left     (NW)
  // ─────────────────────────────────────────────
  getDirectionAnim(angle) {
    const deg = Phaser.Math.RadToDeg(angle);
    if (deg >= -135 && deg < -45) return "walk_ne";
    if (deg >= -45  && deg < 45)  return "walk_se";
    if (deg >= 45   && deg < 135) return "walk_sw";
    return "walk_nw";
  }

  // ─────────────────────────────────────────────
  //  GET IDLE ANIM
  //  Returns the appropriate idle animation based on whatever the player
  //  was just doing (walking or attacking).
  //  This keeps the player facing the same direction when they stop moving.
  // ─────────────────────────────────────────────
  getIdleAnim() {
    const current = this.sprite.anims.currentAnim?.key;

    if (current?.startsWith("walk_")) {
      return current.replace("walk_", "idle_");
    }

    if (current?.startsWith("attack")) {
      return "idle_sw";
    }

    return current || "idle_sw";
  }

  // ─────────────────────────────────────────────
  //  ATTACK
  //  Triggers an attack animation. Faces the player toward the pointer.
  //  Plays a different animation depending on whether a weapon is equipped.
  //  isAttacking locks out movement and additional attacks until the anim ends.
  // ─────────────────────────────────────────────
  attack(pointerX) {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.destination = null;

    this.sprite.flipX = pointerX > this.sprite.x;

    if (this.overlays.weapon) {
      this.sprite.play("attack1");
    } else {
      this.sprite.play("attack2");
    }
  }

  // ─────────────────────────────────────────────
  //  UPDATE  (called every frame by the Phaser game loop)
  //  Syncs equipment overlays first (always runs, even during attacks),
  //  then handles movement toward a destination point.
  // ─────────────────────────────────────────────
  update() {
    // Overlay sync runs unconditionally so weapon sprites track the player
    // and mirror animations even during attack sequences.
    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (overlay) {
        overlay.x = this.sprite.x;
        overlay.y = this.sprite.y;
        overlay.flipX = this.sprite.flipX;

        const playerAnim = this.sprite.anims.currentAnim?.key;
        if (playerAnim) {
          const weaponAnim = `${overlay.itemId}_${playerAnim}`;
          if (overlay.anims.currentAnim?.key !== weaponAnim) {
            overlay.play(weaponAnim);
          }
        }
      }
    }

    if (this.isAttacking) return;

    if (this.destination) {
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        this.destination.x, this.destination.y,
      );

      const dir = this.getDirectionAnim(angle);
      if (this.sprite.anims.currentAnim?.key !== dir) {
        this.sprite.play(dir);
      }

      this.sprite.x += Math.cos(angle) * this.stats.moveSpeed;
      this.sprite.y += Math.sin(angle) * this.stats.moveSpeed;

      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.destination.x, this.destination.y,
      );

      // Snap to destination when within one step to avoid jitter/overshoot.
      if (distance < this.stats.moveSpeed) {
        this.destination = null;
        this.sprite.play(this.getIdleAnim());
      }
    }
  }

  // ─────────────────────────────────────────────
  //  EQUIP
  //  Creates animation clips for the item, spawns its overlay sprite,
  //  and registers it in the overlays map.
  // ─────────────────────────────────────────────
  equip(item) {
    Player.createWeaponAnims(this.scene, item);
    const sprite = this.scene.add.sprite(this.sprite.x, this.sprite.y, `${item.id}_idle`);
    sprite.itemId = item.id;
    sprite.setDepth(1);
    this.overlays[item.slot] = sprite;
  }

  // ─────────────────────────────────────────────
  //  CREATE WEAPON ANIMS  (static)
  //  Registers animation clips for an equipment item, mirroring the
  //  player's animation layout (same frame ranges, directions, and rates).
  // ─────────────────────────────────────────────
  static createWeaponAnims(scene, item) {
    const anims = [
      { key: `${item.id}_walk_sw`, frames: scene.anims.generateFrameNumbers(`${item.id}_walking`, { start: 0,  end: 7  }), frameRate: 8, repeat: -1 },
      { key: `${item.id}_walk_nw`, frames: scene.anims.generateFrameNumbers(`${item.id}_walking`, { start: 8,  end: 15 }), frameRate: 8, repeat: -1 },
      { key: `${item.id}_walk_se`, frames: scene.anims.generateFrameNumbers(`${item.id}_walking`, { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: `${item.id}_walk_ne`, frames: scene.anims.generateFrameNumbers(`${item.id}_walking`, { start: 24, end: 31 }), frameRate: 8, repeat: -1 },
      { key: `${item.id}_idle_sw`, frames: scene.anims.generateFrameNumbers(`${item.id}_idle`, { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: `${item.id}_idle_nw`, frames: scene.anims.generateFrameNumbers(`${item.id}_idle`, { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: `${item.id}_idle_se`, frames: scene.anims.generateFrameNumbers(`${item.id}_idle`, { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: `${item.id}_idle_ne`, frames: scene.anims.generateFrameNumbers(`${item.id}_idle`, { start: 9, end: 11 }), frameRate: 6, repeat: -1 },
      { key: `${item.id}_attack1`, frames: scene.anims.generateFrameNumbers(`${item.id}_attack1`, { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: `${item.id}_attack2`, frames: scene.anims.generateFrameNumbers(`${item.id}_attack2`, { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    ];
    anims.forEach(anim => scene.anims.create(anim));
  }

  // ─────────────────────────────────────────────
  //  CREATE ANIMS  (static — called once in the scene's create())
  //  Registers all player animation clips with Phaser's animation manager.
  //  Each animation is defined by:
  //    key       — unique name used to play the animation
  //    frames    — which frame numbers from the spritesheet to use
  //    frameRate — speed in frames per second
  //    repeat    — -1 = loop forever, 0 = play once
  // ─────────────────────────────────────────────
  static createAnims(scene) {
    const anims = [
      { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0,  end: 7  }), frameRate: 8, repeat: -1 },
      { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8,  end: 15 }), frameRate: 8, repeat: -1 },
      { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },
      { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2  }), frameRate: 6, repeat: -1 },
      { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5  }), frameRate: 6, repeat: -1 },
      { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8  }), frameRate: 6, repeat: -1 },
      { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },
      { key: "attack1", frames: scene.anims.generateFrameNumbers("player_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "attack2", frames: scene.anims.generateFrameNumbers("player_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    ];

    anims.forEach((anim) => scene.anims.create(anim));
  }
}
