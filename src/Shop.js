export default class Shop {
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;
    this.currentPage = 0;
    this.gridCells = [];

    const { width, height } = this.scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    const WIN_W = 1080;
    const WIN_H = 600;

    // ── Toggle button ──
    this.shopBtn = this.scene.add
      .text(20, 20, "ITEMS", {
        fontSize: "16px",
        backgroundColor: "#333",
        padding: { x: 10, y: 6 },
        color: "#fff",
      })
      .setInteractive()
      .setScrollFactor(0);

    // ── Shop panel container ──
    this.shopPanel = this.scene.add.container(0, 0).setScrollFactor(0);

    const shopWindow = this.scene.add.image(cx, cy, 'shop_panel')
      .setDisplaySize(WIN_W, WIN_H)
      .setInteractive();

    this.shopPanel.add([shopWindow]);

    this._renderPage();

    this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
  }

  _renderPage() {}

  show() { this.shopPanel.setVisible(true); }
  hide() { this.shopPanel.setVisible(false); }

  toggle() {
    if (this.shopPanel.visible) {
      this.hide();
    } else {
      this.shopPanel.setVisible(true);
    }
  }
}
