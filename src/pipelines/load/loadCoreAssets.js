import { loadPlayerSpritesheets, loadGoblinSpritesheets } from '../../scene/loadPlayerAssets';

function loadImageBatch(scene, entries) {
    entries.forEach(([key, path]) => scene.load.image(key, path));
}

const UI_IMAGES = [
    ['shop_panel',  'assets/ui/shop_panel.png'],
    ['prev_btn',    'assets/ui/shop_arrow_left.png'],
    ['next_btn',    'assets/ui/shop_arrow_right.png'],
    ['iconborder',  'assets/ui/background.png'],
    ['icon_bg_blue','assets/ui/itemiconbackground.png'],
    ['slot_box',    'assets/ui/Asset 9 - 1080p.png'],
];

export function loadCoreAssets(scene) {
    loadPlayerSpritesheets(scene);
    loadGoblinSpritesheets(scene);
    scene.load.image('player_paperdoll', 'assets/player/Medieval_Warfare_Male_1/Medieval_Warfare_Male_1_Paperdoll.png');
    loadImageBatch(scene, UI_IMAGES);
}
