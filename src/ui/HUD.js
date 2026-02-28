import { DEPTH_HUD, DEPTH_HUD_MID, DEPTH_HUD_TOP, COLOR_HP_BAR_BG, COLOR_DAMAGE_RED } from '../config/constants';

export default class HUD {
  constructor(scene, player) {
    this.scene  = scene;
    this.player = player;

    // ── Layout constants ──
    const camW = scene.cameras.main.width;
    const camH = scene.cameras.main.height;
    const CX   = camW / 2;
    const BY   = camH;

    // ── Scale factor ──
    const base    = Math.min(camW, camH);
    const targetH = base * 0.20;
    const scale   = targetH / 66; // 66 = HUD-Back natural height

    // ── HUD bar layers ──
    this.hudBack = scene.add.image(CX, BY, 'hud-back')
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_HUD).setScale(scale);

    const hudW = 324 * scale;
    const hudH = 66  * scale;

    this.skillSlots = scene.add.image(CX, BY - (hudH * 0.1), 'hud-skill-slots')
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_HUD_MID).setScale(scale);

    this.hudFront = scene.add.image(CX, BY, 'hud-front')
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_HUD_TOP).setScale(scale);

    // ── EXP bar ──
    this.expBar = scene.add.image(CX, BY - (hudH * 0.1), 'hud-exp')
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH_HUD_MID).setScale(scale);
    this.expBarFullWidth = this.expBar.width;
    this.expBar.setCrop(0, 0, this.expBarFullWidth, this.expBar.height);

    // ── Orbs ──
    const hudLeft     = CX - hudW / 2;
    const hudRight    = CX + hudW / 2;
    const hpOrbX      = hudLeft  + (33 * scale);
    const staminaOrbX = hudRight - (33 * scale);
    const orbY        = BY - 4;

    this.hpOrb      = this._makeOrb(hpOrbX,      orbY, 'hud-orb-hp',      scale);
    this.staminaOrb = this._makeOrb(staminaOrbX,  orbY, 'hud-orb-stamina', scale);
    this.manaOrb    = this._makeOrb(staminaOrbX,  orbY, 'hud-orb-mana',    scale);
    this._hideManaOrb();

    // ── HP bar (top-left) ──
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH_HUD);
    this.hpText = scene.add.text(20, 40, '', {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(DEPTH_HUD);
  }

  // ── Private helpers ──

  _makeOrb(x, y, textureKey, scale = 1) {
    const scene = this.scene;

    const bg = scene.add.image(x, y, textureKey)
      .setOrigin(0.5, 1).setScrollFactor(0)
      .setDepth(DEPTH_HUD_MID).setTint(0x222222).setScale(scale);

    const orb = scene.add.image(x, y, textureKey)
      .setOrigin(0.5, 1).setScrollFactor(0)
      .setDepth(DEPTH_HUD_TOP).setScale(scale);

    const orbH = orb.displayHeight;
    const orbW = orb.displayWidth;

    const maskRect = scene.add.graphics().setScrollFactor(0);
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(x - orbW / 2, y - orbH, orbW, orbH);
    maskRect.setDepth(DEPTH_HUD_TOP);
    maskRect.setVisible(false);
    const mask = maskRect.createGeometryMask();
    orb.setMask(mask);

    return { orb, bg, maskRect, orbW, orbH, anchorX: x, anchorY: y };
  }

  _hideManaOrb() {
    this.manaOrb.orb.setVisible(false);
    this.manaOrb.bg.setVisible(false);
    this.staminaOrb.orb.setVisible(true);
    this.staminaOrb.bg.setVisible(true);
  }

  _showManaOrb() {
    this.manaOrb.orb.setVisible(true);
    this.manaOrb.bg.setVisible(true);
    this.staminaOrb.orb.setVisible(false);
    this.staminaOrb.bg.setVisible(false);
  }

  _updateOrb(orbData, current, max) {
    const pct = Math.max(0, Math.min(1, current / max));
    const { anchorX, anchorY, orbW, orbH, maskRect } = orbData;
    const fillH = orbH * pct;
    maskRect.clear();
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(anchorX - orbW / 2, anchorY - fillH, orbW, fillH);
  }

  // ── Game loop ──

  updateHUD() {
    const p   = this.player;
    const pct = Math.max(0, Math.min(1, p.currentHp / p.derivedStats.maxHP));
    this.hpBar.clear();
    this.hpBar.fillStyle(COLOR_HP_BAR_BG);
    this.hpBar.fillRect(20, 20, 200, 16);
    this.hpBar.fillStyle(COLOR_DAMAGE_RED);
    this.hpBar.fillRect(20, 20, 200 * pct, 16);
    this.hpText.setText(`HP: ${p.currentHp} / ${p.derivedStats.maxHP}`);
  }

  update() {
    const p = this.player;
    const d = p.derivedStats;
    this.updateHUD();

    this._updateOrb(this.hpOrb, p.currentHp, d.maxHP);

    if (p.weaponType === 'magic') {
      this._showManaOrb();
      this._updateOrb(this.manaOrb, p.currentMagicka ?? d.maxMagicka, d.maxMagicka);
    } else {
      this._hideManaOrb();
      this._updateOrb(this.staminaOrb, p.currentStamina, d.maxStamina);
    }
  }
}
