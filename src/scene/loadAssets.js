import { loadPlayerSpritesheets } from './loadPlayerAssets';
import { Armory } from "../data/Armory";
import { goblin1 } from "../maps/goblin1";

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
const SELECTION_BORDER_IMAGES = [
    ['border_selected1',    'assets/ui/buy_selected1.png'],
    ['border_selected2',    'assets/ui/buy_selected2.png'],
    ['border_selected3',    'assets/ui/buy_selected3.png'],
    ['border_selected_err', 'assets/ui/buy_selected_err.png'],
    ['blue_selected1',      'assets/ui/blue_selected1.png'],
    ['blue_selected2',      'assets/ui/blue_selected2.png'],
    ['blue_selected3',      'assets/ui/blue_selected3.png'],
    ['red_selected1',       'assets/ui/red_selected1.png'],
    ['red_selected2',       'assets/ui/red_selected2.png'],
    ['red_selected3',       'assets/ui/red_selected3.png'],
];
const HUD_IMAGES = [
    ['hud-back',        'assets/hud/HUD-Back.png'],
    ['hud-front',       'assets/hud/HUD-Front.png'],
    ['hud-orb-border',  'assets/hud/Border.png'],
    ['hud-orb-hp',      'assets/hud/HPBarVar1.png'],
    ['hud-orb-stamina', 'assets/hud/RageBar.png'],
    ['hud-orb-mana',    'assets/hud/ManaBarVar1.png'],
    ['hud-skill-slots', 'assets/hud/SkillSlots.png'],
    ['hud-exp',         'assets/hud/EXPBar.png'],
    ['hud-orb-guard',   'assets/hud/Fill.png'],
];

/**
 * Loads all game assets into the Phaser loader. Call from scene.preload().
 * @param {Phaser.Scene} scene - The active Phaser scene.
 */
export function loadAssets(scene){
    const allItems = Object.values(Armory).flat();
    loadPlayerSpritesheets(scene);
    scene.load.image('player_paperdoll', 'assets/player/Medieval_Warfare_Male_1/Medieval_Warfare_Male_1_Paperdoll.png');
    allItems.forEach(item => {
      scene.load.image(item.id, item.iconPath);
      scene.load.image(item.id + '_overlay', item.overlayPath);
    });
    loadImageBatch(scene, UI_IMAGES);
    loadImageBatch(scene, SELECTION_BORDER_IMAGES);
    loadImageBatch(scene, HUD_IMAGES);

    scene.load.tilemapTiledJSON(goblin1.key, goblin1.tilemapPath);
    goblin1.tilesets.forEach(ts => scene.load.image(ts.name, ts.path));
}