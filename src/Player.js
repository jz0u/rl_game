export default class Player {
    constructor(scene,x,y){
        this.sprite = scene.add.sprite(x, y, "player")
    }

    static preload(scene) {
        scene.load.spritesheet("player", "assets/Medieval_Warfare_Male_1_idle1.png", { frameWidth: 128, frameHeight: 128 })
    }

}