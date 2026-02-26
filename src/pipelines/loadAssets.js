import Player from "../entities/Player";
import { Armory } from "../data/Armory";
import MapManager from "../maps/MapManager";
import { map1 } from "../maps/map1";

/**
 * Loads all game assets into the Phaser loader. Call from scene.preload().
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function loadAssets(scene){
    const allItems = Object.values(Armory).flat();
    Player.preload(scene);
    scene.load.image('player_paperdoll', 'assets/icons/uncropped/Medieval_Warfare_Male_1_Paperdoll.png');
    allItems.forEach(item => {
      scene.load.image(item.id, item.paperdollPath);
      scene.load.image(item.id + '_full', item.paperdollPathFull);
    });
    scene.load.image('shop_panel', 'assets/ui/shop_panel.png');
    scene.load.image('prev_btn', 'assets/ui/shop_arrow_left.png');
    scene.load.image('next_btn', 'assets/ui/shop_arrow_right.png');
    scene.load.image('iconborder', 'assets/ui/background.png');
    scene.load.image('icon_bg_blue','assets/ui/itemiconbackground.png');
    scene.load.image('slot_box','assets/ui/Asset 9 - 1080p.png');
    scene.load.image('border_selected1',   'assets/ui/buy_selected1.png');
    scene.load.image('border_selected2',   'assets/ui/buy_selected2.png');
    scene.load.image('border_selected3',   'assets/ui/buy_selected3.png');
    scene.load.image('border_selected_err','assets/ui/buy_selected_err.png');
    scene.load.image('blue_selected1',     'assets/ui/blue_selected1.png');
    scene.load.image('blue_selected2',     'assets/ui/blue_selected2.png');
    scene.load.image('blue_selected3',     'assets/ui/blue_selected3.png');
    scene.load.image('red_selected1',      'assets/ui/red_selected1.png');
    scene.load.image('red_selected2',      'assets/ui/red_selected2.png');
    scene.load.image('red_selected3',      'assets/ui/red_selected3.png');

    MapManager.load(scene, map1);
}