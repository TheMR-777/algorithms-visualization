// ─── Procedural Audio Engine ────────────────────────────────
// Uses Web Audio API to generate soothing, musical tones
// mapped to algorithm data values. Zero external files.

export type SoundProfile = 'crystals' | 'synth' | 'drops' | 'silent';

// Pentatonic scale (C major) across 3 octaves — always sounds pleasant
const PENTATONIC = [
  261.63, 293.66, 329.63, 392.0, 440.0,       // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.0,        // C5 D5 E5 G5 A5
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0,    // C6 D6 E6 G6 A6
];

// Celebration arpeggio notes (ascending C major pentatonic)
const CELEBRATION_NOTES = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume = 0.25;
  private _profile: SoundProfile = 'crystals';
  private _enabled = false;
  private _lastPlayTime = 0;
  private _minInterval = 30; // ms between notes to avoid overwhelming

  // ─── Initialization ───────────────────
  private ensureContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return { ctx: this.ctx, master: this.masterGain! };
  }

  // ─── Getters/Setters ─────────────────
  get volume() { return this._volume; }
  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ctx!.currentTime, 0.02);
    }
  }

  get profile() { return this._profile; }
  set profile(p: SoundProfile) { this._profile = p; }

  get enabled() { return this._enabled; }
  set enabled(e: boolean) {
    this._enabled = e;
    if (e) this.ensureContext();
  }

  // ─── Core: Play a note from normalized value (0 → 1) ─────
  playNote(normalizedValue: number, _category: 'sort' | 'search' | 'path' = 'sort') {
    if (!this._enabled || this._profile === 'silent') return;

    const now = performance.now();
    if (now - this._lastPlayTime < this._minInterval) return;
    this._lastPlayTime = now;

    const { ctx, master } = this.ensureContext();
    const t = ctx.currentTime;

    // Map normalized value (0-1) to pentatonic scale index
    const clamped = Math.max(0, Math.min(1, normalizedValue));
    const noteIndex = Math.floor(clamped * (PENTATONIC.length - 1));
    const freq = PENTATONIC[noteIndex];

    switch (this._profile) {
      case 'crystals':
        this.playCrystal(ctx, master, freq, t);
        break;
      case 'synth':
        this.playSynth(ctx, master, freq, t);
        break;
      case 'drops':
        this.playDrop(ctx, master, freq, t);
        break;
    }
  }

  // ─── Crystal Chimes: Clean sine with fast decay ───────
  private playCrystal(ctx: AudioContext, master: GainNode, freq: number, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Add subtle harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.001; // slight detune for shimmer
    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.setTargetAtTime(0.001, t, 0.03);

    // Envelope: fast attack, medium decay
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(master);
    gain2.connect(master);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.16);
    osc2.stop(t + 0.13);
  }

  // ─── Synth Waves: Warm triangle with longer sustain ───
  private playSynth(ctx: AudioContext, master: GainNode, freq: number, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = freq * 0.5; // one octave lower for warmth

    filter.type = 'lowpass';
    filter.frequency.value = freq * 1.5;
    filter.Q.value = 2;

    // Envelope: soft attack, gentle decay
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.setTargetAtTime(0.001, t + 0.05, 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // ─── Rain Drops: Filtered noise burst + pitched ping ───
  private playDrop(ctx: AudioContext, master: GainNode, freq: number, t: number) {
    // Pitched ping (sine, very short)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.06);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.09);

    // Noise burst for "splash" texture
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq * 2;
    noiseFilter.Q.value = 3;

    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(t);
  }

  // ─── Celebration: Ascending arpeggio ──────────────────
  playCelebration() {
    if (!this._enabled || this._profile === 'silent') return;
    const { ctx, master } = this.ensureContext();
    const t = ctx.currentTime;

    CELEBRATION_NOTES.forEach((freq, i) => {
      const delay = i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = this._profile === 'synth' ? 'triangle' : 'sine';
      osc.frequency.value = freq;

      // Add shimmer via slight detune
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.002;

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.3, t + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.5);

      gain2.gain.setValueAtTime(0, t + delay);
      gain2.gain.linearRampToValueAtTime(0.1, t + delay + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(master);
      gain2.connect(master);

      osc.start(t + delay);
      osc2.start(t + delay);
      osc.stop(t + delay + 0.55);
      osc2.stop(t + delay + 0.45);
    });
  }

  // ─── UI Click: Short subtle tick ──────────────────────
  playClick() {
    if (!this._enabled || this._profile === 'silent') return;
    const { ctx, master } = this.ensureContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 800;

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // ─── Cleanup ──────────────────────────────────────────
  dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
    this.ctx = null;
    this.masterGain = null;
  }
}

// Singleton
export const audioEngine = new AudioEngine();
