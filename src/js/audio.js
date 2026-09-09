// Web Audio API Synthesizer for Subah Task Book
// Provides rich, peaceful, zero-latency acoustic chimes and bells completely offline.

class SubahAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  // Soft tactile tick
  playClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Peaceful morning chime (Solfeggio harmonic 528 Hz + 660 Hz + 792 Hz)
  playChime() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const freqs = [528, 660, 792, 1056];
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.12;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 1.9);
    });
  }

  // Celebration Fanfare upon completing a task & receiving surprise gift
  playCelebration() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Ascending major arpeggio + shimmering sparkle
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.5);
    });

    // Ambient golden shimmer
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(1760, now + 0.4);
    shimmerGain.gain.setValueAtTime(0.06, now + 0.4);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.ctx.destination);
    shimmer.start(now + 0.4);
    shimmer.stop(now + 2.1);
  }

  // Singing bowl / Tibetan bell when 5-10 min break is finished
  playTimerBell() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 432; // Sacred calming frequency
    const harmonics = [baseFreq, baseFreq * 2.02, baseFreq * 3.01];

    harmonics.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      const amp = 0.18 / (idx + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  }

  // Lock violation warning
  playLockWarn() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(196, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

window.subahAudio = new SubahAudio();
