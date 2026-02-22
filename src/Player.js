export default class Player {
  // ─────────────────────────────────────────────
  //  CONSTRUCTOR
  //  Called once when you do: new Player(scene, x, y)
  //  Sets up the sprite, overlay slots, movement state, and animation hooks.
  // ─────────────────────────────────────────────
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "player_idle1_diag");

    this.overlays = {
      head: null,
      body: null,
      bottom: null,
      feet: null,
      weapon: null,
      offhand: null
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
      { key: "player_idle1_diag", path: "assets/player/Medieval_Warfare_Male_1_idle1_diag.png" },
      { key: "player_walking_diag", path: "assets/player/Medieval_Warfare_Male_1_walking_diag.png" },
      { key: "player_attack1", path: "assets/player/Medieval_Warfare_Male_1_MVsv_alt_attack1.png" },
      { key: "player_attack2", path: "assets/player/Medieval_Warfare_Male_1_MVsv_alt_attack2.png" },

      { key: "longsword_idle", path: "assets/armory/weapon/weapon_idle/Medieval_Warfare_Male_Weapon_Longsword_idle1_diag.png" },
      { key: "longsword_walking", path: "assets/armory/weapon/weapon_walking/Medieval_Warfare_Male_Weapon_Longsword_walking_diag.png" },
      { key: "longsword_attack1", path: "assets/armory/weapon/weapon_attacking/Medieval_Warfare_Male_Weapon_Longsword_MVsv_alt_attack1.png" },
      { key: "longsword_attack2", path: "assets/armory/weapon/weapon_attacking/Medieval_Warfare_Male_Weapon_Longsword_MVsv_alt_attack2.png" },
    ];

    sheets.forEach((sheet) => {
      scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: 128, frameHeight: 128 });
    });

  }

  // ─────────────────────────────────────────────
  //  MOVE TO
  //  Sets a destination point. The update() loop will walk the player there.
  // ─────────────────────────────────────────────
  moveTo(x, y) {
    this.destination = { x, y };
  }
  equip(item) {
    // Destroy existing overlay in this slot if there is one
    if (this.overlays[item.slot]) {
      this.overlays[item.slot].destroy();
    }
    // Create the overlay sprite on top of the player
    const overlay = this.scene.add.sprite(
      this.sprite.x, this.sprite.y, "longsword_idle"
    );
    // Store the item's key prefix so _syncOverlays knows which anims to play
    // e.g. "longsword" → will play "longsword_walk_sw", "longsword_idle_sw", etc.
    overlay.animPrefix = item.animPrefix;
    this.overlays[item.slot] = overlay;

  }
  _syncOverlays() {
    const currentAnim = this.sprite.anims.currentAnim?.key;
  
    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (!overlay) continue;
  
      // Always mirror position and flip from the base sprite
      overlay.x = this.sprite.x;
      overlay.y = this.sprite.y;
      overlay.flipX = this.sprite.flipX;
  
      if (!currentAnim) continue;
  
      // Build the weapon anim key from the player's current anim key
      // e.g. player plays "walk_sw" → overlay plays "longsword_walk_sw"
      const weaponAnim = overlay.animPrefix + "_" + currentAnim;
  
      if (overlay.anims.currentAnim?.key !== weaponAnim) {
        overlay.play(weaponAnim, true);
      }
    }
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
    if (deg >= -45 && deg < 45) return "walk_se";
    if (deg >= 45 && deg < 135) return "walk_sw";
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
    if(this.overlays.weapon) {
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
    this._syncOverlays();
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
      { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
      { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
      { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },
      { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },
      { key: "attack1", frames: scene.anims.generateFrameNumbers("player_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "attack2", frames: scene.anims.generateFrameNumbers("player_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      //longsword animations
      { key: "longsword_walk_sw", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_nw", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_se", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_ne", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },
      { key: "longsword_idle_sw", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_nw", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_se", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_ne", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },
      { key: "longsword_attack1", frames: scene.anims.generateFrameNumbers("longsword_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "longsword_attack2", frames: scene.anims.generateFrameNumbers("longsword_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    ];

    anims.forEach((anim) => scene.anims.create(anim));
  }
}
