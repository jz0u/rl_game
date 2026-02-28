import { playerBaseStats } from '../data/baseStats';
import { computeGearStats } from '../data/gearStats';
import { computeDerivedStats } from '../systems/StatEngine';

/** All player spritesheets use 128×128 px frames. */
const SPRITE_FRAME_SIZE = 128;

/** Render order for equipment overlays. Higher = drawn on top. */
const OVERLAY_DEPTH = {
  legs:        1,
  feet:        2,
  body_inner:  3,
  body_outer:  4,
  hands:       5,
  shoulder:    6,
  amulet:      7,
  head:        8,
  primary:     9,
  secondary:   10,
};

/**
 * Player — the controllable character sprite.
 *
 * Owns the base body sprite and a set of equipment overlay sprites, one per
 * slot. Overlays are kept in sync with the body every frame so they stay
 * positioned and play the matching directional animation.
 */
export default class Player {
  /**
   * @param {Phaser.Scene} scene - The scene this player belongs to.
   * @param {number} x - Initial world X position.
   * @param {number} y - Initial world Y position.
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "player_idle1_diag");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 32);
    this.sprite.body.setOffset(48, 80);
    this.balance = 0;

    /**
     * One sprite overlay per equipment slot; null if that slot is empty.
     * Each overlay plays an animation whose key is `{animPrefix}_{baseAnim}`,
     * mirroring the body's current animation direction.
     */
    this.overlays = {
      head: null,
      shoulder: null,
      hands: null,
      body_inner: null,
      body_outer: null,
      legs: null,
      feet: null,
      primary: null,
      secondary: null,
      amulet: null,
    };

    /** World-space target the player is walking toward; null when idle. */
    this.moveTarget = null;
    this.recomputeStats(new Map());
    this.hasWeapon = false;
    this.weaponType = null; // null | 'melee' | 'ranged' | 'magic'
    /** True while an attack animation is playing — blocks movement and re-triggering. */
    this.attackInProgress = false;

    // When an attack animation finishes, clear the flag and return to idle.
    // _syncOverlays is called immediately so overlays switch in the same tick as the body.
    this.sprite.on("animationcomplete", () => {
      this.attackInProgress = false;
      this._syncOverlays();
      if (this.moveTarget) {
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y,
          this.moveTarget.x, this.moveTarget.y,
        );
        this.sprite.play(this.getDirectionAnim(angle));
      } else {
        this.sprite.play(this.getIdleAnim());
      }
    });
  }

  // ── Asset loading ──

  /**
   * Loads all base player spritesheets. Call this from the scene's preload().
   * Equipment spritesheets are loaded separately when an item is equipped.
   * @param {Phaser.Scene} scene
   */
  static preload(scene) {
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

    const opts = { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE };
    legacySheets.forEach(({ key, path }) => scene.load.spritesheet(key, path, opts));
    newKeys.forEach(key => scene.load.spritesheet(key, `${BASE}${key}.png`, opts));
  }

  // ── Equipment ──

  /**
   * Places an equipment overlay sprite for the given item's slot.
   * If the slot already has an overlay it is destroyed first.
   * The item must have its spritesheets and animations pre-loaded before calling this.
   * @param {{ slot: string, baseName: string }} item
   */
  equip(item) {
    if (this.overlays[item.equipSlot]) {
      this.overlays[item.equipSlot].destroy();
    }

    const textureKey = item.staticOverlay ? item.id + '_overlay' : `${item.baseName}_idle1_diag`;
    const overlay = this.scene.add.sprite(this.sprite.x, this.sprite.y, textureKey);
    overlay.baseName = item.baseName;
    overlay.isStatic = !!item.staticOverlay;
    overlay.setDepth(OVERLAY_DEPTH[item.equipSlot] ?? 0);
    this.overlays[item.equipSlot] = overlay;
  }

  /**
   * Syncs all player overlay sprites to match the given equipped Map.
   * This is the only entry-point for updating visuals from equipment changes;
   * it is called by the EquipmentManager 'equipmentChanged' event listener.
   * @param {Map<string, object|null>} equippedMap - slot → item|null
   */
  syncEquipment(equippedMap) {
    for (const [slot, item] of equippedMap) {
      if (item !== null) {
        this.equip(item);
      } else {
        this.unequip(slot);
      }
    }
    const primary = equippedMap.get('primary');
    this.hasWeapon  = primary != null;
    if (!primary) {
      this.weaponType = null;
    } else if (primary.weaponSubtype === 'staff') {
      this.weaponType = 'magic';
    } else if (primary.rangeType === 'ranged') {
      this.weaponType = 'ranged';
    } else {
      this.weaponType = 'melee';
    }
  }

  /**
   * Removes the equipment overlay for the given slot, if one exists.
   * Call this after inventory.removeItemFromEquipped() to sync the visual.
   * @param {string} slot - Equipment slot key (e.g. 'weapon', 'head').
   */
  unequip(slot) {
    if (this.overlays[slot]) {
      this.overlays[slot].destroy();
      this.overlays[slot] = null;
    }
  }

  /**
   * Called every frame to keep all overlay sprites locked to the body sprite.
   * Matches each overlay's position, flip, and animation to the body's current state.
   * Animation keys follow the pattern `{baseName}_{bodyAnimKey}` (e.g. "Medieval_Warfare_Male_Weapon_Longsword_walk_sw").
   */
  _syncOverlays() {
    const currentAnim = this.sprite.anims.currentAnim?.key;

    for (const slot in this.overlays) {
      const overlay = this.overlays[slot];
      if (!overlay) continue;

      overlay.x = this.sprite.x;
      overlay.y = this.sprite.y;
      overlay.flipX = this.sprite.flipX;

      if (!currentAnim || overlay.isStatic) continue;

      const weaponAnim = overlay.baseName + "_" + currentAnim;
      if (overlay.anims.currentAnim?.key !== weaponAnim && this.scene.anims.exists(weaponAnim)) {
        overlay.play(weaponAnim, true);
      }
    }
  }

  recomputeStats(equippedMap) {
    const gearStats = computeGearStats(equippedMap);
    this.derivedStats = computeDerivedStats(playerBaseStats, gearStats);
  }

  // ── Movement ──

  /**
   * Sets the world-space position the player should walk toward.
   * @param {number} x
   * @param {number} y
   */
  moveTo(x, y) {
    this.moveTarget = { x, y };
  }

  /**
   * Maps a movement angle to one of four diagonal walk animations.
   *   -90° = NE,  0° = SE,  90° = SW,  180° = NW
   * Note: does not use `this` — could be static, kept as instance method for API consistency.
   * @param {number} angle - Angle in radians from Phaser.Math.Angle.Between.
   * @returns {string} Animation key (e.g. "walk_sw").
   */
  getDirectionAnim(angle) {
    const deg = Phaser.Math.RadToDeg(angle);
    if (deg >= -135 && deg < -45) return "walk_ne";
    if (deg >= -45 && deg < 45) return "walk_se";
    if (deg >= 45 && deg < 135) return "walk_sw";
    return "walk_nw";
  }

  /**
   * Returns the idle animation key that matches the player's current facing direction.
   * Converts "walk_{dir}" → "idle_{dir}". Falls back to "idle_sw" if unknown.
   * Note: reads this.sprite — cannot be static.
   * @returns {string} Animation key.
   */
  getIdleAnim() {
    if (this.weaponType === 'ranged') return 'shootingstance';
    const current = this.sprite.anims.currentAnim?.key;
    if (current?.startsWith('walk_')) return current.replace('walk_', 'idle_');
    if (current?.startsWith('idle_')) return current;
    return 'idle_sw';
  }

  // ── Combat ──

  /**
   * Triggers an attack animation toward the given X coordinate.
   * Cancels any active movement. Does nothing if already attacking.
   * Uses attack1 when a weapon overlay is equipped, attack2 (unarmed) otherwise.
   * @param {number} pointerX - World X of the click, used to determine facing direction.
   */
  attack(pointerX) {
    if (this.attackInProgress) return;

    this.attackInProgress = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.flipX = pointerX > this.sprite.x;

    switch (this.weaponType) {
      case 'melee':
      case 'ranged':
      case 'magic':  this.sprite.play('attack1');        break;
      default:       this.sprite.play('martialartpunch');
    }
  }

  /**
   * Triggers a random critical-hit animation.
   * Cancels movement and blocks re-triggering until the animation completes.
   */
  triggerCritical() {
    if (this.attackInProgress) return;

    this.attackInProgress = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.play(`critical${Phaser.Math.Between(1, 6)}`);
  }

  // ── Game loop ──

  /**
   * Called every frame. Handles movement toward the current moveTarget and
   * stops when within one step (avoiding oscillation at the target).
   * Overlays are synced first so they track the sprite even when idle.
   */
  update() {
    this._syncOverlays();
    if (!this.moveTarget && this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
    }
    if (this.attackInProgress) return;

    if (!this.moveTarget) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    this.sprite.flipX = false;
    const dir = this.getDirectionAnim(angle);
    if (this.sprite.anims.currentAnim?.key !== dir) {
      this.sprite.play(dir);
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.moveTarget.x, this.moveTarget.y,
    );

    if (distance < this.derivedStats.moveSpeed * 2) {
      this.sprite.body.setVelocity(0, 0);
      this.moveTarget = null;
      this.sprite.play(this.getIdleAnim());
    } else {
      const speed = this.derivedStats.moveSpeed * 60;
      this.sprite.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
      // If body was stopped by a collider, cancel the move target
      if (
        this.sprite.body.blocked.left ||
        this.sprite.body.blocked.right ||
        this.sprite.body.blocked.up ||
        this.sprite.body.blocked.down
      ) {
        this.sprite.body.setVelocity(0, 0);
        this.moveTarget = null;
        this.sprite.play(this.getIdleAnim());
      }
    }
  }

  // ── Animations ──

  /**
   * Registers all base player animations with the Phaser animation manager.
   * Must be called once after preload(), before any sprites are played.
   * Equipment items register their own animations when equipped.
   * @param {Phaser.Scene} scene
   */
  static createAnims(scene) {
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

    [...anims, ...newAnims].forEach(anim => scene.anims.create(anim));
  }
}
