import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT, GAME_WINDOW_CENTER } from "./main";
export default class Shop {
  constructor(scene, items) {
    this.scene = scene;
    this.items = items;


    this.ShopWindowWidth = GAME_WINDOW_WIDTH*.75;
    this.ShopWindowHeight = GAME_WINDOW_HEIGHT*.75;


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
      .setDisplaySize(this.ShopWindowWidth+100, this.ShopWindowHeight+10)
      .setAlpha(0.8)
      .setInteractive();

      const ShopWinBoundaryLeft = this.scene.add.rectangle(
        GAME_WINDOW_CENTER.X - this.ShopWindowWidth / 4,
        GAME_WINDOW_CENTER.Y,
        this.ShopWindowWidth / 2,
        this.ShopWindowHeight,
        0xff0000, 0.9
      );
      const ShopWinBoundaryRight = this.scene.add.rectangle(
        GAME_WINDOW_CENTER.X + this.ShopWindowWidth / 4,
        GAME_WINDOW_CENTER.Y,
        this.ShopWindowWidth / 2,
        this.ShopWindowHeight,
        0xfff000, 0.9
      );
  //add to panel container
    this.shopPanel.add([shopWindow,ShopWinBoundaryLeft,ShopWinBoundaryRight]);

    this._renderPage(0);

    //this.shopPanel.setVisible(false);
    this.shopPanel.setDepth(10);

    this.shopBtn.on("pointerdown", () => this.toggle());
  }//END Shop Panel Container

  _renderPage(pageNumber) {
    const cellSize = 128;
    const cols = Math.floor((this.ShopWindowWidth / 2) / cellSize);
    const rows = Math.floor(this.ShopWindowHeight / cellSize);
    const originX = GAME_WINDOW_CENTER.X;
    const originY = GAME_WINDOW_CENTER.Y - this.ShopWindowHeight / 2;
    const itemsPerPage = cols * rows;
  
    const pageItems = this.items.slice(pageNumber * itemsPerPage, (pageNumber + 1) * itemsPerPage);
  
    pageItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = originX + col * cellSize + cellSize / 2;
      const y = originY + row * cellSize + cellSize / 2;
  
      const icon = this.scene.add.image(x, y, item.id)
        .setDisplaySize(cellSize - 8, cellSize - 8)
        .setInteractive();
  
      this.shopPanel.add(icon);
    });
  }

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
