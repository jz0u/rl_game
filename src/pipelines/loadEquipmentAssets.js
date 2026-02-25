/**
 * Dynamically loads spritesheets and registers animations for a single equipment item.
 * Safe to call multiple times — skips loading if the texture is already cached.
 * Call this before player.equip(item) to ensure overlay animations are available.
 *
 * @param {Phaser.Scene} scene
 * @param {object} item - An Armory item definition with a baseName property.
 */
export function loadEquipmentAssets(scene, item) {
  const base = item.baseName;

  // Keys for the 4 spritesheets this item needs
  const idleKey    = base + '_idle1_diag';
  const walkKey    = base + '_walking_diag';
  const attack1Key = base + '_MVsv_alt_attack1';
  const attack2Key = base + '_MVsv_alt_attack2';

  // If already loaded, just ensure anims exist and return
  if (scene.textures.exists(idleKey)) {
    _registerAnims(scene, base);
    return;
  }

  // Load all 4 spritesheets
  const folder = _slotFolder(item.slot);
  scene.load.spritesheet(idleKey,
    `assets/armory/${folder}/${folder}_idle/${base}_idle1_diag.png`,
    { frameWidth: 128, frameHeight: 128 }
  );
  scene.load.spritesheet(walkKey,
    `assets/armory/${folder}/${folder}_walking/${base}_walking_diag.png`,
    { frameWidth: 128, frameHeight: 128 }
  );
  scene.load.spritesheet(attack1Key,
    `assets/armory/${folder}/${folder}_attacking/${base}_MVsv_alt_attack1.png`,
    { frameWidth: 128, frameHeight: 128 }
  );
  scene.load.spritesheet(attack2Key,
    `assets/armory/${folder}/${folder}_attacking/${base}_MVsv_alt_attack2.png`,
    { frameWidth: 128, frameHeight: 128 }
  );

  // Once loaded, register all animations
  scene.load.once('complete', () => {
    _registerAnims(scene, base);
  });

  scene.load.start();
}

/**
 * Maps an item slot name to its armory subfolder name.
 * @param {string} slot
 * @returns {string}
 */
function _slotFolder(slot) {
  const map = {
    head:    'head',
    body:    'body',
    bottom:  'bottom',
    feet:    'feet',
    weapon:  'weapon',
    offhand: 'offhand',
  };
  return map[slot] || slot;
}

/**
 * Registers all 8 directional animations for an equipment overlay.
 * Animation keys follow the pattern {baseName}_{playerAnimKey}
 * e.g. "Medieval_Warfare_Male_Head_1_walk_sw"
 * Skips any animation that is already registered.
 * @param {Phaser.Scene} scene
 * @param {string} base - The item's baseName.
 */
function _registerAnims(scene, base) {
  const idleKey    = base + '_idle1_diag';
  const walkKey    = base + '_walking_diag';
  const attack1Key = base + '_MVsv_alt_attack1';
  const attack2Key = base + '_MVsv_alt_attack2';

  const anims = [
    // Walk — 8 frames per row, 4 rows
    { key: base + '_walk_sw', texture: walkKey,    start: 0,  end: 7,  frameRate: 8, repeat: -1 },
    { key: base + '_walk_nw', texture: walkKey,    start: 8,  end: 15, frameRate: 8, repeat: -1 },
    { key: base + '_walk_se', texture: walkKey,    start: 16, end: 23, frameRate: 8, repeat: -1 },
    { key: base + '_walk_ne', texture: walkKey,    start: 24, end: 31, frameRate: 8, repeat: -1 },

    // Idle — 3 frames per row, 4 rows
    { key: base + '_idle_sw', texture: idleKey,    start: 0,  end: 2,  frameRate: 6, repeat: -1 },
    { key: base + '_idle_nw', texture: idleKey,    start: 3,  end: 5,  frameRate: 6, repeat: -1 },
    { key: base + '_idle_se', texture: idleKey,    start: 6,  end: 8,  frameRate: 6, repeat: -1 },
    { key: base + '_idle_ne', texture: idleKey,    start: 9,  end: 11, frameRate: 6, repeat: -1 },

    // Attack — 3 frames, single row
    { key: base + '_attack1', texture: attack1Key, start: 0,  end: 2,  frameRate: 8, repeat: 0 },
    { key: base + '_attack2', texture: attack2Key, start: 0,  end: 2,  frameRate: 8, repeat: 0 },
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
