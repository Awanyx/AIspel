/**
 * Synthesised audio — no external files required.
 * All sounds are generated on-the-fly via the Web Audio API.
 * Import the `Snd` singleton and call its methods from any scene.
 */

const MUTE_KEY = 'svt_arkiv_muted';

// Am-pentatonic melody: A3 C4 D4 E4 G4 — soft background arpeggio
// Each entry: [frequency Hz, duration s]
const MUSIC_PATTERN = [
  [220, 0.35], [261, 0.35], [293, 0.35], [330, 0.70],
  [392, 0.35], [330, 0.35], [261, 0.35], [220, 0.70],
  [0,   0.35],
  [293, 0.35], [392, 0.35], [440, 0.35], [392, 0.70],
  [330, 0.35], [293, 0.35], [261, 0.70],
  [0,   0.35],
];
const MUSIC_LOOP_DUR = MUSIC_PATTERN.reduce((s, [, d]) => s + d, 0); // ≈ 7.2 s

class AudioManager {
  constructor() {
    this._actx       = null;
    this._master     = null;
    this._musicRun   = false;
    this._musicTimer = null;
    this._musicBeat  = 0;      // Web Audio clock time for next note
    this._muted      = localStorage.getItem(MUTE_KEY) === '1';
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get muted() { return this._muted; }

  /** Toggle mute; returns new muted state. */
  toggle() {
    this._muted = !this._muted;
    localStorage.setItem(MUTE_KEY, this._muted ? '1' : '0');
    if (this._master) {
      this._master.gain.setTargetAtTime(
        this._muted ? 0 : 1,
        this._actx.currentTime,
        0.05
      );
    }
    return this._muted;
  }

  /** Call once on the first user gesture to unlock the AudioContext. */
  resume() {
    if (this._actx?.state === 'suspended') this._actx.resume();
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  swap() {
    const [ctx, t] = this._ready();
    this._osc(ctx, 'sine',     600, t,        0.08, 0.28, 150);
    this._osc(ctx, 'triangle', 300, t + 0.02, 0.06, 0.18);
  }

  pop(tileIndex = 0) {
    // Each tile in a match gets a slightly higher pitch (ascending cascade)
    const [ctx, t] = this._ready();
    const freq = 520 + tileIndex * 40;
    this._osc(ctx, 'sine', freq, t, 0.22, 0.06);
    // Tiny click transient
    this._noise(ctx, t, 0.015, 0.15, 4000, 'highpass');
  }

  specialCreate() {
    const [ctx, t] = this._ready();
    // Ascending 3-note chime: C5 E5 G5
    [[523, 0], [659, 0.1], [784, 0.2]].forEach(([f, delay]) => {
      this._osc(ctx, 'triangle', f, t + delay, 0.3, 0.28);
    });
  }

  specialActivate(type) {
    const [ctx, t] = this._ready();
    switch (type) {
      case 'bolibompa':    this._sfxBolibompa(ctx, t);     break;
      case 'pippi':        this._sfxPippi(ctx, t);         break;
      case 'ratatoskr':    this._sfxRatatoskr(ctx, t);     break;
      case 'sommarskuggan':this._sfxSommarskuggan(ctx, t); break;
    }
  }

  levelComplete() {
    const [ctx, t] = this._ready();
    // Ascending fanfare: C5 E5 G5 C6
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]].forEach(([f, delay]) => {
      this._osc(ctx, 'triangle', f, t + delay, 0.55, 0.38);
    });
  }

  fail() {
    const [ctx, t] = this._ready();
    // Descending minor fall
    [[320, 0], [254, 0.16], [180, 0.32]].forEach(([f, delay]) => {
      this._osc(ctx, 'sawtooth', f, t + delay, 0.25, 0.22);
    });
  }

  blockerCrack() {
    const [ctx, t] = this._ready();
    this._noise(ctx, t, 0.08, 0.45, 1200, 'bandpass');
    this._noise(ctx, t, 0.04, 0.20, 4000, 'highpass');
  }

  // ── Music ──────────────────────────────────────────────────────────────────

  startMusic() {
    if (this._musicRun) return;
    this._musicRun  = true;
    const ctx = this._getCtx();
    this._musicBeat = ctx.currentTime + 0.15;
    this._scheduleMusic();
  }

  stopMusic() {
    this._musicRun = false;
    clearTimeout(this._musicTimer);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  _ready() {
    const ctx = this._getCtx();
    return [ctx, ctx.currentTime];
  }

  _getCtx() {
    if (!this._actx) {
      this._actx = new (window.AudioContext || window.webkitAudioContext)();
      this._master = this._actx.createGain();
      this._master.gain.value = this._muted ? 0 : 1;
      this._master.connect(this._actx.destination);
    }
    if (this._actx.state === 'suspended') this._actx.resume();
    return this._actx;
  }

  /** Create an oscillator with a simple attack/decay envelope. */
  _osc(ctx, type, startFreq, startTime, gain, duration, endFreq = null) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (endFreq !== null) osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    const atk = Math.min(0.015, duration * 0.1);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g); g.connect(this._master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /** White-noise burst through a filter. */
  _noise(ctx, startTime, gain, duration, filterFreq, filterType = 'bandpass') {
    const bufSize = Math.ceil(ctx.sampleRate * duration);
    const buf  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type  = filterType;
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    src.connect(filter); filter.connect(g); g.connect(this._master);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  // ── Special activation sounds ──────────────────────────────────────────────

  _sfxBolibompa(ctx, t) {
    // Low rumble sweep + noise burst
    this._osc(ctx, 'sawtooth', 90, t, 0.45, 0.35, 40);
    this._osc(ctx, 'sawtooth', 180, t, 0.25, 0.35, 60);
    this._noise(ctx, t, 0.55, 0.30, 220, 'bandpass');
    this._noise(ctx, t + 0.05, 0.30, 0.15, 800, 'bandpass');
  }

  _sfxPippi(ctx, t) {
    // Rising whoosh + bright sweep
    this._osc(ctx, 'sawtooth', 140, t, 0.40, 0.28, 900);
    this._osc(ctx, 'triangle', 280, t + 0.05, 0.20, 0.22, 1200);
    this._noise(ctx, t, 0.15, 0.28, 3000, 'highpass');
  }

  _sfxRatatoskr(ctx, t) {
    // Rapid staccato ascending notes
    [360, 450, 570, 720, 900].forEach((f, i) => {
      this._osc(ctx, 'square', f, t + i * 0.055, 0.18, 0.08);
    });
  }

  _sfxSommarskuggan(ctx, t) {
    // Low warbling goo sound with LFO-like pitch wobble
    this._osc(ctx, 'sine',     100, t,        0.45, 0.55, 55);
    this._osc(ctx, 'sine',     150, t + 0.05, 0.30, 0.45, 80);
    this._osc(ctx, 'triangle', 200, t + 0.10, 0.20, 0.35, 100);
    this._noise(ctx, t, 0.18, 0.55, 180, 'lowpass');
  }

  // ── Music scheduler ────────────────────────────────────────────────────────

  _scheduleMusic() {
    if (!this._musicRun) return;
    const ctx  = this._getCtx();
    const gain = 0.045; // quiet background level

    let offset = 0;
    for (const [freq, dur] of MUSIC_PATTERN) {
      if (freq > 0) {
        const t = this._musicBeat + offset;
        this._osc(ctx, 'triangle', freq, t, gain, dur * 0.85);
        // Subtle bass an octave lower on the first note of each phrase
        if (offset === 0) this._osc(ctx, 'sine', freq / 2, t, gain * 0.6, dur * 0.9);
      }
      offset += dur;
    }

    this._musicBeat += MUSIC_LOOP_DUR;

    // Re-schedule 0.6 s before the loop ends so notes are always pre-buffered
    const msUntilReschedule = (this._musicBeat - ctx.currentTime - 0.6) * 1000;
    this._musicTimer = setTimeout(
      () => this._scheduleMusic(),
      Math.max(0, msUntilReschedule)
    );
  }
}

export const Snd = new AudioManager();
