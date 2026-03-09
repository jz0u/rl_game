function loadImageBatch(scene, entries) {
    entries.forEach(([key, path]) => scene.load.image(key, path));
}

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

export function loadHUDAssets(scene) {
    loadImageBatch(scene, SELECTION_BORDER_IMAGES);
    loadImageBatch(scene, HUD_IMAGES);
}
