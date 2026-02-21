export default class Player {
  constructor(scene, x, y) {
    this.sprite = scene.add.sprite(x, y, "player_idle1_diag");
    this.destination = null;
    this.stats = { moveSpeed: 3 };
  }

  static preload(scene) {
    const sheets = [
      { key: "player_idle1_diag", path: "assets/Medieval_Warfare_Male_1_idle1_diag.png" },
      { key: "player_idle2_diag", path: "assets/Medieval_Warfare_Male_1_idle2_diag.png" },
      { key: "player_walking_diag", path: "assets/Medieval_Warfare_Male_1_walking_diag.png" },
    ];
    sheets.forEach((sheet) => {
      scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: 128, frameHeight: 128 });
    });
  }

  moveTo(x, y) {
    this.destination = { x, y };
  }

  getDirectionAnim(angle) {
    const deg = Phaser.Math.RadToDeg(angle);
    if (deg >= -135 && deg < -45) return "walk_ne";
    if (deg >= -45 && deg < 45)   return "walk_se";
    if (deg >= 45 && deg < 135)   return "walk_sw";
    return "walk_nw";
  }

  getIdleAnim() {
    const current = this.sprite.anims.currentAnim?.key
    if (current?.startsWith("walk_")) {
      return current.replace("walk_", "idle_")
    }
    return "idle_sw"
  }

  update() {
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
      if (distance < this.stats.moveSpeed) {
        this.destination = null;
        this.sprite.play(this.getIdleAnim());
      }
    }
  }

  static createAnims(scene) {
    const anims = [
      { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0,  end: 7  }), frameRate: 8, repeat: -1 },
      { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8,  end: 15 }), frameRate: 8, repeat: -1 },
      { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
      { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },
      { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
      { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
      { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
      { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },
    ];
    anims.forEach((anim) => {
      scene.anims.create(anim);
    });
  }
}