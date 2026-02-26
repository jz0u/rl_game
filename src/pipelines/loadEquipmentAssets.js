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

  // If already loaded, just ensure anims exist and fix up any overlay, then return
  if (scene.textures.exists(idleKey)) {
    _registerAnims(scene, base);
    _refreshOverlay(scene, base, idleKey);
    return;
  }

  // Build paths
  const folder = item.slot;
  const idlePath    = `assets/armory/${folder}/${folder}_idle/${base}_idle1_diag.png`;
  const walkPath    = `assets/armory/${folder}/${folder}_walking/${base}_walking_diag.png`;
  const attack1Path = `assets/armory/${folder}/${folder}_attacking/${base}_MVsv_alt_attack1.png`;
  const attack2Path = `assets/armory/${folder}/${folder}_attacking/${base}_MVsv_alt_attack2.png`;

  // Load all 4 spritesheets
  scene.load.spritesheet(idleKey,    idlePath,    { frameWidth: 128, frameHeight: 128 });
  scene.load.spritesheet(walkKey,    walkPath,    { frameWidth: 128, frameHeight: 128 });
  scene.load.spritesheet(attack1Key, attack1Path, { frameWidth: 128, frameHeight: 128 });
  scene.load.spritesheet(attack2Key, attack2Path, { frameWidth: 128, frameHeight: 128 });

  // Once loaded, register animations and fix up the overlay sprite's texture
  scene.load.once('complete', () => {
    _registerAnims(scene, base);
    _refreshOverlay(scene, base, idleKey);
  });

  scene.load.start();
}

/**
 * After loading completes, updates any existing player overlay sprite for this item
 * to the correct texture. Needed because player.equip() may be called before the
 * async load finishes.
 * @param {Phaser.Scene} scene
 * @param {string} base - The item's baseName.
 * @param {string} idleKey - The loaded idle spritesheet texture key.
 */
function _refreshOverlay(scene, base, idleKey) {
  for (const slot in scene.player.overlays) {
    const overlay = scene.player.overlays[slot];
    if (overlay && overlay.baseName === base) {
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
