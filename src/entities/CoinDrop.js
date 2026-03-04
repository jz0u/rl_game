export default class CoinDrop {
  constructor(scene, x, y, value = 1) {
    this.scene = scene;
    this.value = value;
    this.collected = false;

    this.circle = scene.add.arc(x, y, 7, 0, 360, false, 0xffd700).setDepth(5);
    this.label  = scene.add.text(x, y, 'G', {
      fontSize: '8px',
      color: '#7a5000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

    scene.tweens.add({
      targets:   [this.circle, this.label],
      y:         `+=${4}`,
      yoyo:      true,
      repeat:    -1,
      ease:      'Sine.easeInOut',
      duration:  600,
    });
  }

  get x() { return this.circle.x; }
  get y() { return this.circle.y; }

  collect() {
    if (this.collected) return;
    this.collected = true;

    const circle = this.circle;
    const label  = this.label;

    this.scene.tweens.add({
      targets:  [circle, label],
      alpha:    0,
      y:        `-=${20}`,
      duration: 250,
      ease:     'Power2',
      onComplete: () => {
        circle.destroy();
        label.destroy();
      },
    });
  }

  destroy() {
    this.circle.destroy();
    this.label.destroy();
  }
}
