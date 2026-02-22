import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";
export default class Shop {
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;


    const ShopWindowWidth = GAME_WINDOW_WIDTH*.75;
    const ShopWindowHeight = GAME_WINDOW_HEIGHT*.75;

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
    //end toggle button

    // ── Shop panel container ──
    this.shopPanel = this.scene.add.container(0, 0).setScrollFactor(0);
    

    const shopWindow = this.scene.add.image(GAME_WINDOW_CENTER.X, GAME_WINDOW_CENTER.Y, 'shop_panel')
      .setDisplaySize(ShopWindowWidth, ShopWindowHeight)
      .setAlpha(0.8)
      .setInteractive();

    this.shopPanel.add([shopWindow]);

    this._renderPage();

    //this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
  }//END Shop Panel Container

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
