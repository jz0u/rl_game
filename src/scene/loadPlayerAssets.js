import { SPRITE_FRAME_SIZE } from '../config/constants';

/**
 * Loads all base player spritesheets. Call this from the scene's preload().
 * Equipment spritesheets are loaded separately when an item is equipped.
 * @param {Phaser.Scene} scene
 */
export function loadPlayerSpritesheets(scene) {
  // Legacy placeholder sheets — existing animation keys still reference these.
  const legacySheets = [
    { key: 'player_idle1_diag',   path: 'assets/player/player_idle.png' },
    { key: 'player_walking_diag', path: 'assets/player/player_walk.png' },
    { key: 'player_attack1',      path: 'assets/player/player_attack1.png' },
    { key: 'player_attack2',      path: 'assets/player/player_attack2.png' },
  ];

  // All Medieval_Warfare_Male_1 spritesheets.
  // Key = filename minus .png (exact artist naming convention).
  // Note: for animations with both a regular and _diag variant, _diag is the
  // primary gameplay animation; straight-facing variants are loaded for completeness.
  const BASE = 'assets/player/Medieval_Warfare_Male_1/';
  const newKeys = [
    'Medieval_Warfare_Male_1_collapse',
    'Medieval_Warfare_Male_1_collapse_diag',
    'Medieval_Warfare_Male_1_dead',
    'Medieval_Warfare_Male_1_dead_diag',
    'Medieval_Warfare_Male_1_idle1',
    'Medieval_Warfare_Male_1_idle1_diag',
    'Medieval_Warfare_Male_1_idle2',
    'Medieval_Warfare_Male_1_idle2_diag',
    'Medieval_Warfare_Male_1_kneel',
    'Medieval_Warfare_Male_1_kneel_diag',
    'Medieval_Warfare_Male_1_ko',
    'Medieval_Warfare_Male_1_ko_diag',
    'Medieval_Warfare_Male_1_running',
    'Medieval_Warfare_Male_1_running_diag',
    'Medieval_Warfare_Male_1_sitting1',
    'Medieval_Warfare_Male_1_sitting1_diag',
    'Medieval_Warfare_Male_1_sitting2',
    'Medieval_Warfare_Male_1_sitting2_diag',
    'Medieval_Warfare_Male_1_sleeping',
    'Medieval_Warfare_Male_1_sleeping_diag',
    'Medieval_Warfare_Male_1_walking',
    'Medieval_Warfare_Male_1_walking_diag',
    'Medieval_Warfare_Male_1_MVsv',
    'Medieval_Warfare_Male_1_MVsv_alt_attack1',
    'Medieval_Warfare_Male_1_MVsv_alt_attack2',
    'Medieval_Warfare_Male_1_MVsv_alt_critical1',
    'Medieval_Warfare_Male_1_MVsv_alt_critical2',
    'Medieval_Warfare_Male_1_MVsv_alt_critical3',
    'Medieval_Warfare_Male_1_MVsv_alt_critical4',
    'Medieval_Warfare_Male_1_MVsv_alt_critical5',
    'Medieval_Warfare_Male_1_MVsv_alt_critical6',
    'Medieval_Warfare_Male_1_MVsv_alt_dead1',
    'Medieval_Warfare_Male_1_MVsv_alt_dead2',
    'Medieval_Warfare_Male_1_MVsv_alt_dead3',
    'Medieval_Warfare_Male_1_MVsv_alt_magic',
    'Medieval_Warfare_Male_1_MVsv_alt_martialartcritical',
    'Medieval_Warfare_Male_1_MVsv_alt_martialartpunch',
    'Medieval_Warfare_Male_1_MVsv_alt_martialartstance',
    'Medieval_Warfare_Male_1_MVsv_alt_shooting',
    'Medieval_Warfare_Male_1_MVsv_alt_shootingstance',
    'Medieval_Warfare_Male_1_MVsv_alt_stance1',
    'Medieval_Warfare_Male_1_MVsv_alt_stance2',
    'Medieval_Warfare_Male_1_MVsv_alt_stance3',
    'Medieval_Warfare_Male_1_MVsv_alt_stance4',
    'Medieval_Warfare_Male_1_MVsv_alt_stance5',
    'Medieval_Warfare_Male_1_MVsv_alt_stance6',
    'Medieval_Warfare_Male_1_MVsv_alt_victory1',
    'Medieval_Warfare_Male_1_MVsv_alt_victory2',
    'Medieval_Warfare_Male_1_MVsv_alt_victory3',
    'Medieval_Warfare_Male_1_MVsv_alt_victory4',
    'Medieval_Warfare_Male_1_MVsv_alt_victory5',
    'Medieval_Warfare_Male_1_MVsv_alt_victory6',
    'Medieval_Warfare_Male_1_MVsv_alt_victory7',
    'Medieval_Warfare_Male_1_MVsv_alt_victory8',
  ];

  const SHADOW_BASE = 'assets/player/Medieval_Male_Shadow/';
  const shadowKeys = [
    'Medieval_Shadow_Male_idle1_diag',
    'Medieval_Shadow_Male_idle2_diag',
    'Medieval_Shadow_Male_walking_diag',
    'Medieval_Shadow_Male_running_diag',
    'Medieval_Shadow_Male_collapse_diag',
    'Medieval_Shadow_Male_dead_diag',
    'Medieval_Shadow_Male_ko_diag',
    'Medieval_Shadow_Male_kneel_diag',
    'Medieval_Shadow_Male_sitting1_diag',
    'Medieval_Shadow_Male_sitting2_diag',
    'Medieval_Shadow_Male_sleeping_diag',
    'Medieval_Shadow_Male_MVsv_alt_attack1',
    'Medieval_Shadow_Male_MVsv_alt_attack2',
    'Medieval_Shadow_Male_MVsv_alt_critical1',
    'Medieval_Shadow_Male_MVsv_alt_critical2',
    'Medieval_Shadow_Male_MVsv_alt_critical3',
    'Medieval_Shadow_Male_MVsv_alt_critical4',
    'Medieval_Shadow_Male_MVsv_alt_critical5',
    'Medieval_Shadow_Male_MVsv_alt_critical6',
    'Medieval_Shadow_Male_MVsv_alt_dead1',
    'Medieval_Shadow_Male_MVsv_alt_dead2',
    'Medieval_Shadow_Male_MVsv_alt_dead3',
    'Medieval_Shadow_Male_MVsv_alt_magic',
    'Medieval_Shadow_Male_MVsv_alt_martialartpunch',
    'Medieval_Shadow_Male_MVsv_alt_martialartcritical',
    'Medieval_Shadow_Male_MVsv_alt_martialartstance',
    'Medieval_Shadow_Male_MVsv_alt_shooting',
    'Medieval_Shadow_Male_MVsv_alt_shootingstance',
    'Medieval_Shadow_Male_MVsv_alt_stance1',
    'Medieval_Shadow_Male_MVsv_alt_stance2',
    'Medieval_Shadow_Male_MVsv_alt_stance3',
    'Medieval_Shadow_Male_MVsv_alt_stance4',
    'Medieval_Shadow_Male_MVsv_alt_stance5',
    'Medieval_Shadow_Male_MVsv_alt_stance6',
    'Medieval_Shadow_Male_MVsv_alt_victory1',
    'Medieval_Shadow_Male_MVsv_alt_victory2',
    'Medieval_Shadow_Male_MVsv_alt_victory3',
    'Medieval_Shadow_Male_MVsv_alt_victory4',
    'Medieval_Shadow_Male_MVsv_alt_victory5',
    'Medieval_Shadow_Male_MVsv_alt_victory6',
    'Medieval_Shadow_Male_MVsv_alt_victory7',
    'Medieval_Shadow_Male_MVsv_alt_victory8',
  ];

  const opts = { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE };
  legacySheets.forEach(({ key, path }) => scene.load.spritesheet(key, path, opts));
  newKeys.forEach(key => scene.load.spritesheet(key, `${BASE}${key}.png`, opts));
  shadowKeys.forEach(key => scene.load.spritesheet(key, `${SHADOW_BASE}${key}.png`, opts));
}

/**
 * Registers all base player animations with the Phaser animation manager.
 * Must be called once after preload(), before any sprites are played.
 * Equipment items register their own animations when equipped.
 * @param {Phaser.Scene} scene
 */
export function registerPlayerAnims(scene) {
  const anims = [
    // Player walk
    { key: "walk_sw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 0, end: 7 }), frameRate: 8, repeat: -1 },
    { key: "walk_nw", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 8, end: 15 }), frameRate: 8, repeat: -1 },
    { key: "walk_se", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 16, end: 23 }), frameRate: 8, repeat: -1 },
    { key: "walk_ne", frames: scene.anims.generateFrameNumbers("player_walking_diag", { start: 24, end: 31 }), frameRate: 8, repeat: -1 },

    // Player idle
    { key: "idle_sw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 0, end: 2 }), frameRate: 6, repeat: -1 },
    { key: "idle_nw", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 3, end: 5 }), frameRate: 6, repeat: -1 },
    { key: "idle_se", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 6, end: 8 }), frameRate: 6, repeat: -1 },
    { key: "idle_ne", frames: scene.anims.generateFrameNumbers("player_idle1_diag", { start: 9, end: 11 }), frameRate: 6, repeat: -1 },

    // Player attack
    { key: "attack1", frames: scene.anims.generateFrameNumbers("Medieval_Warfare_Male_1_MVsv_alt_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
    { key: "attack2", frames: scene.anims.generateFrameNumbers("Medieval_Warfare_Male_1_MVsv_alt_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
  ];

  // Helpers for building directional _diag animation groups.
  // Row layout: SW=row 0, NW=row 1, SE=row 2, NE=row 3 (matches idle/walk pattern).
  const diag3 = (key, sheet, rate, rep) => [
    { key: `${key}_sw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 0,  end: 2  }), frameRate: rate, repeat: rep },
    { key: `${key}_nw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 3,  end: 5  }), frameRate: rate, repeat: rep },
    { key: `${key}_se`, frames: scene.anims.generateFrameNumbers(sheet, { start: 6,  end: 8  }), frameRate: rate, repeat: rep },
    { key: `${key}_ne`, frames: scene.anims.generateFrameNumbers(sheet, { start: 9,  end: 11 }), frameRate: rate, repeat: rep },
  ];
  const diag8 = (key, sheet, rate, rep) => [
    { key: `${key}_sw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 0,  end: 7  }), frameRate: rate, repeat: rep },
    { key: `${key}_nw`, frames: scene.anims.generateFrameNumbers(sheet, { start: 8,  end: 15 }), frameRate: rate, repeat: rep },
    { key: `${key}_se`, frames: scene.anims.generateFrameNumbers(sheet, { start: 16, end: 23 }), frameRate: rate, repeat: rep },
    { key: `${key}_ne`, frames: scene.anims.generateFrameNumbers(sheet, { start: 24, end: 31 }), frameRate: rate, repeat: rep },
  ];
  // Single-row MVsv_alt sheets — 3 frames, no directional variants.
  const mv = (key, sheet, rate, rep) =>
    ({ key, frames: scene.anims.generateFrameNumbers(sheet, { start: 0, end: 2 }), frameRate: rate, repeat: rep });

  const newAnims = [
    // Directional _diag animations (3 frames/dir × 4 dirs)
    ...diag3('collapse', 'Medieval_Warfare_Male_1_collapse_diag',  8,  0),
    ...diag3('dead',     'Medieval_Warfare_Male_1_dead_diag',      8,  0),
    ...diag3('ko',       'Medieval_Warfare_Male_1_ko_diag',        8,  0),
    ...diag8('run',      'Medieval_Warfare_Male_1_running_diag',   10, -1),
    ...diag3('kneel',    'Medieval_Warfare_Male_1_kneel_diag',     6,  0),
    ...diag3('sit1',     'Medieval_Warfare_Male_1_sitting1_diag',  6,  0),
    ...diag3('sit2',     'Medieval_Warfare_Male_1_sitting2_diag',  6,  0),
    ...diag3('sleep',    'Medieval_Warfare_Male_1_sleeping_diag',  6,  0),

    // MVsv_alt non-directional animations (3 frames each)
    ...[1,2,3,4,5,6].map(n => mv(`critical${n}`,  `Medieval_Warfare_Male_1_MVsv_alt_critical${n}`,  12, 0)),
    ...[1,2,3].map(n =>       mv(`mvdead${n}`,    `Medieval_Warfare_Male_1_MVsv_alt_dead${n}`,       8, 0)),
    mv('magic',            'Medieval_Warfare_Male_1_MVsv_alt_magic',            10, 0),
    ...[1,2,3,4,5,6,7,8].map(n => mv(`victory${n}`, `Medieval_Warfare_Male_1_MVsv_alt_victory${n}`, 10, 0)),
    mv('shooting',         'Medieval_Warfare_Male_1_MVsv_alt_shooting',         10, 0),
    mv('shootingstance',   'Medieval_Warfare_Male_1_MVsv_alt_shootingstance',   10, 0),
    ...[1,2,3,4,5,6].map(n => mv(`stance${n}`,    `Medieval_Warfare_Male_1_MVsv_alt_stance${n}`,     6, 0)),
    mv('martialartpunch',    'Medieval_Warfare_Male_1_MVsv_alt_martialartpunch',    12, 0),
    mv('martialartcritical', 'Medieval_Warfare_Male_1_MVsv_alt_martialartcritical', 12, 0),
    mv('martialartstance',   'Medieval_Warfare_Male_1_MVsv_alt_martialartstance',   12, 0),
  ];

  // Shadow animations — 'shadow_' prefix, mirrors every body anim key.
  const S = 'Medieval_Shadow_Male_';
  const shadowAnims = [
    // Directional _diag
    ...diag8('shadow_walk',     S + 'walking_diag',   8,  -1),
    ...diag3('shadow_idle',     S + 'idle1_diag',     6,  -1),
    ...diag8('shadow_run',      S + 'running_diag',   10, -1),
    ...diag3('shadow_collapse', S + 'collapse_diag',  8,   0),
    ...diag3('shadow_dead',     S + 'dead_diag',      8,   0),
    ...diag3('shadow_ko',       S + 'ko_diag',        8,   0),
    ...diag3('shadow_kneel',    S + 'kneel_diag',     6,   0),
    ...diag3('shadow_sit1',     S + 'sitting1_diag',  6,   0),
    ...diag3('shadow_sit2',     S + 'sitting2_diag',  6,   0),
    ...diag3('shadow_sleep',    S + 'sleeping_diag',  6,   0),
    // MVsv_alt
    mv('shadow_attack1',          S + 'MVsv_alt_attack1',          8,  0),
    mv('shadow_attack2',          S + 'MVsv_alt_attack2',          8,  0),
    ...[1,2,3,4,5,6].map(n => mv(`shadow_critical${n}`,  S + `MVsv_alt_critical${n}`,  12, 0)),
    ...[1,2,3].map(n =>       mv(`shadow_mvdead${n}`,    S + `MVsv_alt_dead${n}`,       8,  0)),
    mv('shadow_magic',            S + 'MVsv_alt_magic',            10, 0),
    mv('shadow_shooting',         S + 'MVsv_alt_shooting',         10, 0),
    mv('shadow_shootingstance',   S + 'MVsv_alt_shootingstance',   10, 0),
    ...[1,2,3,4,5,6].map(n => mv(`shadow_stance${n}`,    S + `MVsv_alt_stance${n}`,     6,  0)),
    mv('shadow_martialartpunch',    S + 'MVsv_alt_martialartpunch',    12, 0),
    mv('shadow_martialartcritical', S + 'MVsv_alt_martialartcritical', 12, 0),
    mv('shadow_martialartstance',   S + 'MVsv_alt_martialartstance',   12, 0),
    ...[1,2,3,4,5,6,7,8].map(n => mv(`shadow_victory${n}`, S + `MVsv_alt_victory${n}`, 10, 0)),
  ];

  [...anims, ...newAnims, ...shadowAnims].forEach(anim => scene.anims.create(anim));
}
