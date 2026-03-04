import { DEPTH_HUD, DEPTH_HUD_MID, DEPTH_HUD_TOP } from '../config/constants';

export default class HUD {
  constructor(scene, player) {
    this.scene  = scene;
    this.player = player;

    const camH = scene.cameras.main.height;

    // Scale orbs to ~13% of screen height
    const naturalH = scene.textures.get('hud-orb-hp').getSourceImage().height;
    const orbScale = (camH * 0.13) / naturalH;

    // Compute orb display dimensions at this scale
    const naturalW = scene.textures.get('hud-orb-hp').getSourceImage().width;
    const orbW     = naturalW * orbScale;
    const orbH     = naturalH * orbScale;

    // Top-left anchor — origin(0.5, 1) so Y = bottom edge of orb
    const pad  = orbW * 0.25;
    const gap  = orbH * 0.25;
    const orbX = pad + orbW / 2;

    const y1 = pad + orbH;
    const y2 = y1 + gap + orbH;
    const y3 = y2 + gap + orbH;

    this.hpOrb      = this._makeOrb(orbX, y1, 'hud-orb-hp',      orbScale);
    this.guardOrb   = this._makeGuardOrb(orbX, y1, orbW, orbH);
    this.staminaOrb = this._makeOrb(orbX, y2, 'hud-orb-stamina',  orbScale);
    this.manaOrb    = this._makeOrb(orbX, y3, 'hud-orb-mana',     orbScale);

    this.goldText = scene.add.text(scene.cameras.main.width - 16, 16, 'Gold: 0', {
      fontSize: '16px', color: '#ffd700', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH_HUD_TOP + 2);
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

    const borderNaturalW = scene.textures.get('hud-orb-border').getSourceImage().width;
    const borderScale    = (orbW * 1.2) / borderNaturalW;
    scene.add.image(x, y + orbH * 0.1, 'hud-orb-border')
      .setOrigin(0.5, 1).setScrollFactor(0)
      .setDepth(DEPTH_HUD_TOP + 2).setScale(borderScale);

    const maskRect = scene.add.graphics().setScrollFactor(0);
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(x - orbW / 2, y - orbH, orbW, orbH);
    maskRect.setDepth(DEPTH_HUD_TOP);
    maskRect.setVisible(false);
    const mask = maskRect.createGeometryMask();
    orb.setMask(mask);

    const fontSize = Math.max(9, Math.round(orbH * 0.14));
    const label = scene.add.text(x, y - orbH / 2, '', {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH_HUD_TOP + 3);

    return { orb, bg, maskRect, orbW, orbH, anchorX: x, anchorY: y, label };
  }

  _makeGuardOrb(x, y, targetW, targetH) {
    const scene = this.scene;

    const orb = scene.add.image(x, y, 'hud-orb-guard')
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH_HUD_TOP + 1)
      .setDisplaySize(targetW, targetH);

    const orbW = orb.displayWidth;
    const orbH = orb.displayHeight;

    const maskRect = scene.add.graphics().setScrollFactor(0);
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(x - orbW / 2, y - orbH, orbW, orbH);
    maskRect.setDepth(DEPTH_HUD_TOP + 1);
    maskRect.setVisible(false);
    const mask = maskRect.createGeometryMask();
    orb.setMask(mask);

    const label = { setText: () => {} };

    return { orb, maskRect, orbW, orbH, anchorX: x, anchorY: y, label };
  }

  _updateOrb(orbData, current, max) {
    const pct = Math.max(0, Math.min(1, current / max));
    const { anchorX, anchorY, orbW, orbH, maskRect } = orbData;
    const fillH = orbH * pct;
    maskRect.clear();
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(anchorX - orbW / 2, anchorY - fillH, orbW, fillH);
    orbData.label.setText(`${current.toFixed(2)} / ${max.toFixed(2)}`);
  }

  // ── Game loop ──

  update() {
    const p = this.player;
    const d = p.derivedStats;
    this._updateOrb(this.hpOrb,      p.currentHp,                      d.maxHP);
    this._updateOrb(this.guardOrb,   p.currentGuard,                   d.maxGuard);
    this._updateOrb(this.staminaOrb, p.currentStamina,                  d.maxStamina);
    this._updateOrb(this.manaOrb,    p.currentMagicka ?? d.maxMagicka,  d.maxMagicka);
    if (this.scene.bank) this.goldText.setText(`Gold: ${this.scene.bank.balance}`);
  }
}
