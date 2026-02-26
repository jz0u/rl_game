// matches player sprite frame size
const SPRITE_FRAME_SIZE = 128;

const SLOT_FOLDER = {
  primary:   'primary_weapon',
  secondary: 'secondary_weapon',
  feet:      'feets',
};
function folderFor(slot) { return SLOT_FOLDER[slot] ?? slot; }

/**
 * Dynamically loads spritesheets and registers animations for a single equipment item.
 * Safe to call multiple times — skips loading if the texture is already cached.
 * Call this before player.equip(item) to ensure overlay animations are available.
 *
 * @param {Phaser.Scene} scene
 * @param {object} item - An Armory item definition with baseName and slot properties.
 */
export function loadEquipmentAssets(scene, item) {
  const { baseName, slot } = item;
  // The actual animation file name prefix inside the subdirectory. Resolution order:
  //   animFileName → fileName → baseName
  // animFileName: Paperdoll matches baseName but animation files use a different prefix (e.g. T&C→TC).
  // fileName: both Paperdoll and animations use a different prefix from baseName (e.g. _Main_/_Off_ weapons).
  const fileName = item.animFileName ?? item.fileName ?? baseName;
  const folder = folderFor(slot);

  // Texture keys use baseName (unique per item, even when files share a name across folders)
  const idleKey    = baseName + '_idle1_diag';
  const walkKey    = baseName + '_walking_diag';
  const attack1Key = baseName + '_MVsv_alt_attack1';
  const attack2Key = baseName + '_MVsv_alt_attack2';

  // If already loaded, just ensure anims exist and fix up any overlay, then return
  if (scene.textures.exists(idleKey)) {
    _registerAnims(scene, baseName);
    _refreshOverlay(scene, baseName, idleKey);
    return;
  }

  // Build paths: assets/armory/{folder}/{baseName}/{fileName}_anim.png
  scene.load.spritesheet(idleKey,    `assets/armory/${folder}/${baseName}/${fileName}_idle1_diag.png`,    { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE });
  scene.load.spritesheet(walkKey,    `assets/armory/${folder}/${baseName}/${fileName}_walking_diag.png`,  { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE });
  scene.load.spritesheet(attack1Key, `assets/armory/${folder}/${baseName}/${fileName}_MVsv_alt_attack1.png`, { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE });
  scene.load.spritesheet(attack2Key, `assets/armory/${folder}/${baseName}/${fileName}_MVsv_alt_attack2.png`, { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE });

  // Once loaded, register animations and fix up the overlay sprite's texture
  scene.load.once('complete', () => {
    _registerAnims(scene, baseName);
    _refreshOverlay(scene, baseName, idleKey);
  });

  scene.load.start();
}

/**
 * After loading completes, updates any existing player overlay sprite for this item
 * to the correct texture. Needed because player.equip() may be called before the
 * async load finishes.
 * @param {Phaser.Scene} scene
 * @param {string} baseName - The item's baseName.
 * @param {string} idleKey - The loaded idle spritesheet texture key.
 */
function _refreshOverlay(scene, baseName, idleKey) {
  for (const slot in scene.player.overlays) {
    const overlay = scene.player.overlays[slot];
    if (overlay && overlay.baseName === baseName) {
      overlay.setTexture(idleKey);
    }
  }
}

/**
 * Registers all 8 directional animations for an equipment overlay.
 * Animation keys follow the pattern {baseName}_{playerAnimKey}
 * e.g. "Medieval_Warfare_Male_Head_1_walk_sw"
 * Skips any animation that is already registered.
 * @param {Phaser.Scene} scene
 * @param {string} baseName - The item's baseName.
 */
function _registerAnims(scene, baseName) {
  const idleKey    = baseName + '_idle1_diag';
  const walkKey    = baseName + '_walking_diag';
  const attack1Key = baseName + '_MVsv_alt_attack1';
  const attack2Key = baseName + '_MVsv_alt_attack2';

  // Assumed layout: walk is 8 frames per row across 4 rows, idle is 3 frames per row across 4 rows,
  // attack is 3 frames in a single row. If the spritesheet layout changes these frame numbers must be updated.
  const anims = [
    // Walk — 8 frames per row, 4 rows
    { key: baseName + '_walk_sw', texture: walkKey,    start: 0,  end: 7,  frameRate: 8, repeat: -1 },
    { key: baseName + '_walk_nw', texture: walkKey,    start: 8,  end: 15, frameRate: 8, repeat: -1 },
    { key: baseName + '_walk_se', texture: walkKey,    start: 16, end: 23, frameRate: 8, repeat: -1 },
    { key: baseName + '_walk_ne', texture: walkKey,    start: 24, end: 31, frameRate: 8, repeat: -1 },

    // Idle — 3 frames per row, 4 rows
    { key: baseName + '_idle_sw', texture: idleKey,    start: 0,  end: 2,  frameRate: 6, repeat: -1 },
    { key: baseName + '_idle_nw', texture: idleKey,    start: 3,  end: 5,  frameRate: 6, repeat: -1 },
    { key: baseName + '_idle_se', texture: idleKey,    start: 6,  end: 8,  frameRate: 6, repeat: -1 },
    { key: baseName + '_idle_ne', texture: idleKey,    start: 9,  end: 11, frameRate: 6, repeat: -1 },

    // Attack — 3 frames, single row
    { key: baseName + '_attack1', texture: attack1Key, start: 0,  end: 2,  frameRate: 8, repeat: 0 },
    { key: baseName + '_attack2', texture: attack2Key, start: 0,  end: 2,  frameRate: 8, repeat: 0 },
  ];

  for (const anim of anims) {
    if (scene.anims.exists(anim.key)) continue;
    scene.anims.create({
      key: anim.key,
      frames: scene.anims.generateFrameNumbers(anim.texture, { start: anim.start, end: anim.end }),
      frameRate: anim.frameRate,
      repeat: anim.repeat,
    });
  }
}
