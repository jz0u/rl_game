const ARC_HALF = {
  stab:   Math.PI / 8,
  medium: (Math.PI * 3) / 8,
  wide:   (Math.PI * 5) / 8,
};

export default class CombatEffects {
  static showArc(scene, x, y, angle, arcType, range) {
    const g = scene.add.graphics();
    g.setDepth(9998);
    g.fillStyle(0xffff00, 0.15);
    g.lineStyle(1, 0xffff00, 0.4);
    const half = ARC_HALF[arcType] ?? ARC_HALF.stab;
    g.slice(x, y, range, angle - half, angle + half, false);
    g.fillPath();
    g.strokePath();
    scene.tweens.add({
      targets:    g,
      alpha:      0,
      duration:   300,
      onComplete: () => g.destroy(),
    });
  }

  static showSlashTrail(scene, x, y, angle, arcType, range) {
    const g = scene.add.graphics();
    g.setDepth(9999);
    g.lineStyle(3, 0xffffff, 0.9);
    const half = ARC_HALF[arcType] ?? ARC_HALF.stab;
    const steps = 20;
    const startAngle = angle - half;
    const endAngle   = angle + half;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      points.push({
        x: x + Math.cos(a) * range * 0.6,
        y: y + Math.sin(a) * range * 0.6,
      });
    }
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    points.forEach(p => g.lineTo(p.x, p.y));
    g.strokePath();
    scene.tweens.add({
      targets:    g,
      alpha:      0,
      duration:   200,
      onComplete: () => g.destroy(),
    });
  }

  static showImpactFlash(scene, x, y) {
    const g = scene.add.graphics();
    g.setDepth(9999);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x, y, 8);
    g.lineStyle(2, 0xffdd00, 1);
    g.strokeCircle(x, y, 12);
    scene.tweens.add({
      targets:    g,
      alpha:      0,
      scaleX:     2.5,
      scaleY:     2.5,
      duration:   150,
      ease:       'Power2',
      onComplete: () => g.destroy(),
    });
  }

  static showParticleBurst(scene, x, y) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const g = scene.add.graphics();
      g.setDepth(9999);
      g.fillStyle(0xffdd00, 1);
      g.fillRect(-3, -3, 6, 6);
      g.x = x;
      g.y = y;
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(30, 80);
      scene.tweens.add({
        targets:    g,
        x:          x + Math.cos(angle) * speed,
        y:          y + Math.sin(angle) * speed,
        alpha:      0,
        duration:   Phaser.Math.Between(200, 400),
        ease:       'Power1',
        onComplete: () => g.destroy(),
      });
    }
  }
}
