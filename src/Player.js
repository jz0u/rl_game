export default class Player {
  constructor(scene, x, y) {
    this.sprite = scene.add.sprite(x, y, "player");
    this.destination = null;
    this.stats = { moveSpeed: 3 };
  }

  static preload(scene) {
    scene.load.spritesheet(
      "player",
      "assets/Medieval_Warfare_Male_1_idle1.png",
      { frameWidth: 128, frameHeight: 128 },
    );
  }

  moveTo(x, y) {
    this.destination = { x, y };
  }

  update() {
    if (this.destination) {
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x,
        this.sprite.y,
        this.destination.x,
        this.destination.y,
      );
      this.sprite.x += Math.cos(angle) * this.stats.moveSpeed;
      this.sprite.y += Math.sin(angle) * this.stats.moveSpeed;
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.destination.x,
        this.destination.y,
      );
      if (distance < this.stats.moveSpeed) {
        this.destination = null;
      }
    }
  }
}
