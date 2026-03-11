class LevelClock {
  constructor() {
    this.startTime = null;
    this.finalMs   = 0;
    this.running   = false;
  }

  start() {
    this.startTime = Date.now();
    this.running   = true;
  }

  stop() {
    if (this.running) {
      this.finalMs = Date.now() - this.startTime;
      this.running = false;
    }
  }

  reset() {
    this.startTime = null;
    this.finalMs   = 0;
    this.running   = false;
  }

  getElapsed() {
    if (this.running) return Date.now() - this.startTime;
    return this.finalMs;
  }

  getElapsedSeconds() {
    return this.getElapsed() / 1000;
  }
}

export default new LevelClock();
