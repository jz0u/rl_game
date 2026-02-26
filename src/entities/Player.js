/** All player spritesheets use 128×128 px frames. */
const SPRITE_FRAME_SIZE = 128;

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
    this.sprite = scene.add.sprite(x, y, "player_idle1_diag");
    this.balance = 0;

    /**
     * One sprite overlay per equipment slot; null if that slot is empty.
     * Each overlay plays an animation whose key is `{animPrefix}_{baseAnim}`,
     * mirroring the body's current animation direction.
     */
    this.overlays = {
      head: null,
      body: null,
      bottom: null,
      feet: null,
      weapon: null,
      offhand: null,
    };

    /** World-space target the player is walking toward; null when idle. */
    this.destination = null;
    this.stats = { moveSpeed: 3 };
    /** True while an attack animation is playing — blocks movement and re-triggering. */
    this.isAttacking = false;

    // When an attack animation finishes, clear the flag and return to idle.
    // _syncOverlays is called immediately so overlays switch in the same tick as the body.
    this.sprite.on("animationcomplete", () => {
      this.isAttacking = false;
      this.sprite.play(this.getIdleAnim());
      this._syncOverlays();
    });
  }

  // ── Asset loading ──

  /**
   * Loads all base player spritesheets. Call this from the scene's preload().
   * Equipment spritesheets are loaded separately when an item is equipped.
   * @param {Phaser.Scene} scene
   */
  static preload(scene) {
    const sheets = [
      { key: "player_idle1_diag", path: "assets/player/player_idle.png" },
      { key: "player_walking_diag", path: "assets/player/player_walk.png" },
      { key: "player_attack1", path: "assets/player/player_attack1.png" },
      { key: "player_attack2", path: "assets/player/player_attack2.png" },
    ];

    sheets.forEach((sheet) => {
      scene.load.spritesheet(sheet.key, sheet.path, { frameWidth: SPRITE_FRAME_SIZE, frameHeight: SPRITE_FRAME_SIZE });
    });
  }

  // ── Equipment ──

  /**
   * Places an equipment overlay sprite for the given item's slot.
   * If the slot already has an overlay it is destroyed first.
   * The item must have its spritesheets and animations pre-loaded before calling this.
   * @param {{ slot: string, baseName: string }} item
   */
  equip(item) {
    if (this.overlays[item.slot]) {
      this.overlays[item.slot].destroy();
    }

    const overlay = this.scene.add.sprite(this.sprite.x, this.sprite.y, `${item.baseName}_idle1_diag`);
    overlay.baseName = item.baseName;
    this.overlays[item.slot] = overlay;
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

      if (!currentAnim) continue;

      const weaponAnim = overlay.baseName + "_" + currentAnim;
      if (overlay.anims.currentAnim?.key !== weaponAnim) {
        overlay.play(weaponAnim, true);
      }
    }
  }

  // ── Movement ──

  /**
   * Sets the world-space position the player should walk toward.
   * @param {number} x
   * @param {number} y
   */
  moveTo(x, y) {
    this.destination = { x, y };
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
    const current = this.sprite.anims.currentAnim?.key;
    if (current?.startsWith("walk_")) return current.replace("walk_", "idle_");
    if (current?.startsWith("attack")) return "idle_sw";
    return current || "idle_sw";
  }

  // ── Combat ──

  /**
   * Triggers an attack animation toward the given X coordinate.
   * Cancels any active movement. Does nothing if already attacking.
   * Uses attack1 when a weapon overlay is equipped, attack2 (unarmed) otherwise.
   * @param {number} pointerX - World X of the click, used to determine facing direction.
   */
  attack(pointerX) {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.destination = null;
    this.sprite.flipX = pointerX > this.sprite.x;

    this.sprite.play(this.overlays.weapon ? "attack1" : "attack2");
  }

  // ── Game loop ──

  /**
   * Called every frame. Handles movement toward the current destination and
   * stops when within one step (avoiding oscillation at the target).
   * Overlays are synced first so they track the sprite even when idle.
   */
  update() {
    this._syncOverlays();
    if (this.isAttacking) return;

    if (!this.destination) return;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.destination.x, this.destination.y,
    );

    this.sprite.flipX = false;
    const dir = this.getDirectionAnim(angle);
    if (this.sprite.anims.currentAnim?.key !== dir) {
      this.sprite.play(dir);
    }

    this.sprite.x += Math.cos(angle) * this.stats.moveSpeed;
    this.sprite.y += Math.sin(angle) * this.stats.moveSpeed;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.destination.x, this.destination.y,
    );

    if (distance < this.stats.moveSpeed) {
      this.destination = null;
      this.sprite.play(this.getIdleAnim());
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
      { key: "attack1", frames: scene.anims.generateFrameNumbers("player_attack1", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },
      { key: "attack2", frames: scene.anims.generateFrameNumbers("player_attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 },

    ];

    anims.forEach((anim) => scene.anims.create(anim));
  }
}
