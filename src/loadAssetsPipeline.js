import Player from "./Player";
import { Armory } from "./Armory";
export function loadAssets(scene){
    const allItems = Object.values(Armory).flat();
    Player.preload(scene);
    scene.load.image('player_paperdoll', 'assets/icons/uncropped/Medieval_Warfare_Male_1_Paperdoll.png');
    allItems.forEach(item => {
      scene.load.image(item.id, item.paperdollPath);
      scene.load.image(item.id + '_full', item.paperdollPathFull);
    });
    scene.load.image('shop_panel', 'assets/ui/shop_panel.png');
    scene.load.image('inventory_panel', 'assets/ui/shop_panel.png');

    scene.load.image('prev_btn', 'assets/ui/shop_arrow_left.png');
    scene.load.image('next_btn', 'assets/ui/shop_arrow_right.png');
}