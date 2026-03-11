import { DEPTH_UI_TOP } from '../config/constants';

export default class ClockDisplay {
  constructor(scene, levelClock) {
    this.clock = levelClock;
    this.text  = null;
    document.fonts.ready.then(() => {
      this.text = scene.add.text(640, 20, '00:00', {
        fontSize:   '20px',
        fontFamily: 'darinia',
        color:      '#ffffff',
      }).setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(DEPTH_UI_TOP);
    });
  }

  update() {
    if (!this.text) return;
    const total = Math.floor(this.clock.getElapsedSeconds());
    const mm    = String(Math.floor(total / 60)).padStart(2, '0');
    const ss    = String(total % 60).padStart(2, '0');
    this.text.setText(`${mm}:${ss}`);
  }
}
