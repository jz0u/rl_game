export default class Inventory {
  constructor(scene) {
    this.scene = scene;

    const { width, height } = this.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    // ── Toggle button ──
    this.inventoryBtn = this.scene.add
      .text(20, 56, "INVENTORY", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── Panel ──
    this.panel = this.scene.add.container(0, 0).setScrollFactor(0);
    const window = this.scene.add
      .rectangle(cx, cy, 1000, 500, 0x222222, 0.9)
      .setInteractive();
    const title = this.scene.add.text(cx, cy - 230, "Inventory", {
      fontSize: "20px",
      color: "#fff",
    }).setOrigin(0.5);
    this.panel.add([window, title]);
    this.panel.setVisible(false);
    this.panel.setDepth(10);

    this.inventoryBtn.on("pointerdown", () => this.toggle());
  }

  show() { this.panel.setVisible(true); }
  hide() { this.panel.setVisible(false); }
  toggle() {
    if (this.panel.visible) {
      this.hide();
    } else {
      this.panel.setVisible(true);
    }
  }
}
