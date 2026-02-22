export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "player_idle1_diag");

    this.overlays = {
      head: null,
      body: null,
      bottom: null,
      feet: null,
      weapon: null,
      offhand: null,
    };

    this.destination = null;
    this.stats = { moveSpeed: 3 };
    this.isAttacking = false;

    this.sprite.on("animationcomplete", () => {
      this.isAttacking = false;
      this.sprite.play(this.getIdleAnim());
    });
  }

  // ── Asset loading ──

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

  // ── Equipment ──

  equip(item) {
    if (this.overlays[item.slot]) {
      this.overlays[item.slot].destroy();
    }

    const overlay = this.scene.add.sprite(this.sprite.x, this.sprite.y, "longsword_idle");
    overlay.animPrefix = item.animPrefix;
    this.overlays[item.slot] = overlay;
  }

  _syncOverlays() {
    const currentAnim = this.sprite.anims.currentAnim?.key;

    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (!overlay) continue;

      overlay.x = this.sprite.x;
      overlay.y = this.sprite.y;
      overlay.flipX = this.sprite.flipX;

      if (!currentAnim) continue;

      const weaponAnim = overlay.animPrefix + "_" + currentAnim;
      if (overlay.anims.currentAnim?.key !== weaponAnim) {
        overlay.play(weaponAnim, true);
      }
    }
  }

  // ── Movement ──

  moveTo(x, y) {
    this.destination = { x, y };
  }

  /**
   * Maps a movement angle to one of four diagonal walk animations.
   *   -90° = NE,  0° = SE,  90° = SW,  180° = NW
   */
  getDirectionAnim(angle) {
    const deg = Phaser.Math.RadToDeg(angle);
    if (deg >= -135 && deg < -45) return "walk_ne";
    if (deg >= -45 && deg < 45) return "walk_se";
    if (deg >= 45 && deg < 135) return "walk_sw";
    return "walk_nw";
  }

  getIdleAnim() {
    const current = this.sprite.anims.currentAnim?.key;
    if (current?.startsWith("walk_")) return current.replace("walk_", "idle_");
    if (current?.startsWith("attack")) return "idle_sw";
    return current || "idle_sw";
  }

  // ── Combat ──

  attack(pointerX) {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.destination = null;
    this.sprite.flipX = pointerX > this.sprite.x;

    this.sprite.play(this.overlays.weapon ? "attack1" : "attack2");
  }

  // ── Game loop ──

  update() {
    this._syncOverlays();
    if (this.isAttacking) return;

    if (!this.destination) return;

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

    if (distance < this.stats.moveSpeed) {
      this.destination = null;
      this.sprite.play(this.getIdleAnim());
    }
  }

  // ── Animations ──

  static createAnims(scene) {
    const anims = [
      // Player walk
      { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
      { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
      { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },

      // Player idle
      { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },

      // Player attack
      { key: "attack1", frames: scene.anims.generateFrameNumbers("player_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "attack2", frames: scene.anims.generateFrameNumbers("player_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },

      // Longsword walk
      { key: "longsword_walk_sw", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_nw", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_se", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "longsword_walk_ne", frames: scene.anims.generateFrameNumbers("longsword_walking", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },

      // Longsword idle
      { key: "longsword_idle_sw", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_nw", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_se", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "longsword_idle_ne", frames: scene.anims.generateFrameNumbers("longsword_idle", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },

      // Longsword attack
      { key: "longsword_attack1", frames: scene.anims.generateFrameNumbers("longsword_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "longsword_attack2", frames: scene.anims.generateFrameNumbers("longsword_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    ];

    anims.forEach((anim) => scene.anims.create(anim));
  }
}
