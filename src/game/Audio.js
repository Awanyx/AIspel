/**
 * Synthesised audio — no external files required.
 * All sounds are generated on-the-fly via the Web Audio API.
 */

const MUTE_KEY = 'svt_arkiv_muted';

// ─── Music patterns ──────────────────────────────────────────────────────────
// Each entry: [frequency Hz, duration s]  (freq 0 = rest)
// Index 0 = menu/map, indices 1-8 = levels 1-8

const PATTERNS = [
  // 0 — Menu: Am pentatonic, gentle arpeggio
  [
    [220,0.35],[261,0.35],[293,0.35],[330,0.70],
    [392,0.35],[330,0.35],[261,0.35],[220,0.70],[0,0.35],
    [293,0.35],[392,0.35],[440,0.35],[392,0.70],
    [330,0.35],[293,0.35],[261,0.70],[0,0.35],
  ],
  // 1 — Level 1: C major pentatonic, simple and friendly
  [
    [261,0.35],[293,0.35],[330,0.35],[392,0.70],
    [440,0.35],[392,0.35],[330,0.35],[261,0.70],[0,0.35],
    [293,0.35],[330,0.35],[392,0.35],[523,0.70],
    [440,0.35],[392,0.35],[330,0.70],[0,0.35],
  ],
  // 2 — Level 2: G major, brighter and slightly faster
  [
    [392,0.30],[440,0.30],[494,0.30],[587,0.60],
    [523,0.30],[494,0.30],[440,0.30],[392,0.60],[0,0.30],
    [392,0.30],[494,0.30],[587,0.30],[659,0.60],
    [587,0.30],[523,0.30],[440,0.30],[392,0.60],[0,0.30],
  ],
  // 3 — Level 3: D minor, darker feel for blocker level
  [
    [293,0.40],[349,0.40],[293,0.40],[440,0.80],
    [392,0.40],[349,0.40],[293,0.80],[0,0.40],
    [349,0.40],[392,0.40],[440,0.40],[349,0.80],
    [293,0.40],[261,0.40],[293,0.80],[0,0.40],
  ],
  // 4 — Level 4: E minor, tense driving pulse (time attack)
  [
    [330,0.28],[330,0.28],[392,0.28],[494,0.56],
    [440,0.28],[392,0.28],[330,0.28],[294,0.56],[0,0.28],
    [330,0.28],[392,0.28],[440,0.28],[494,0.56],
    [587,0.28],[494,0.28],[440,0.56],[0,0.28],
  ],
  // 5 — Level 5: F major, triumphant mid-game surge
  [
    [349,0.32],[440,0.32],[523,0.32],[587,0.64],
    [523,0.32],[440,0.32],[349,0.32],[294,0.64],[0,0.32],
    [349,0.32],[392,0.32],[440,0.32],[523,0.64],
    [587,0.32],[523,0.32],[440,0.32],[349,0.64],[0,0.32],
  ],
  // 6 — Level 6: B minor, mysterious/eerie for hard blockers
  [
    [247,0.38],[294,0.38],[370,0.38],[330,0.76],
    [247,0.38],[220,0.38],[247,0.76],[0,0.38],
    [294,0.38],[370,0.38],[440,0.38],[494,0.76],
    [440,0.38],[370,0.38],[294,0.76],[0,0.38],
  ],
  // 7 — Level 7: A minor high-octave, racing urgency (short time attack)
  [
    [440,0.22],[523,0.22],[587,0.22],[659,0.44],
    [587,0.22],[523,0.22],[440,0.22],[392,0.44],[0,0.22],
    [440,0.22],[494,0.22],[587,0.22],[659,0.44],
    [784,0.22],[659,0.22],[587,0.44],[0,0.22],
  ],
  // 8 — Level 8: C# minor, dramatic finale
  [
    [277,0.28],[330,0.28],[415,0.28],[494,0.56],
    [554,0.28],[494,0.28],[415,0.28],[330,0.56],[0,0.28],
    [277,0.28],[370,0.28],[415,0.28],[554,0.56],
    [622,0.28],[554,0.28],[415,0.28],[277,0.56],[0,0.28],
  ],
];

class AudioManager {
  constructor() {
    this._actx           = null;
    this._master         = null;
    this._musicRun       = false;
    this._musicTimer     = null;
    this._musicBeat      = 0;
    this._currentPattern = PATTERNS[0];
    this._currentIdx     = -1;
    this._tempoMult      = 1.0;
    this._muted          = localStorage.getItem(MUTE_KEY) === '1';
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get muted() { return this._muted; }

  toggle() {
    this._muted = !this._muted;
    localStorage.setItem(MUTE_KEY, this._muted ? '1' : '0');
    if (this._master) {
      this._master.gain.setTargetAtTime(this._muted ? 0 : 1, this._actx.currentTime, 0.05);
    }
    return this._muted;
  }

  resume() {
    if (this._actx?.state === 'suspended') this._actx.resume();
  }

  /** Start (or switch to) the music for a given level (0 = menu/map). */
  startMusic(levelId = 0) {
    const idx     = Math.max(0, Math.min(levelId, PATTERNS.length - 1));
    const pattern = PATTERNS[idx];

    // Same pattern already playing — don't interrupt
    if (this._currentIdx === idx && this._musicRun) return;

    this._currentIdx     = idx;
    this._currentPattern = pattern;
    this._tempoMult      = 1.0;

    clearTimeout(this._musicTimer);
    this._musicRun  = true;
    const ctx = this._getCtx();
    this._musicBeat = ctx.currentTime + 0.15;
    this._scheduleMusic();
  }

  stopMusic() {
    this._musicRun = false;
    clearTimeout(this._musicTimer);
  }

  /**
   * Switch tempo for urgency (low moves / low time).
   * urgent=true → ~1.65× faster; urgent=false → normal.
   * Restarts the loop immediately so the change is heard right away.
   */
  setUrgency(urgent) {
    const target = urgent ? 0.6 : 1.0;
    if (this._tempoMult === target) return;
    this._tempoMult = target;
    if (!this._musicRun) return;
    clearTimeout(this._musicTimer);
    this._musicBeat = this._getCtx().currentTime + 0.05;
    this._scheduleMusic();
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  swap() {
    const [ctx, t] = this._ready();
    this._osc(ctx, 'sine',     600, t,        0.08, 0.28, 150);
    this._osc(ctx, 'triangle', 300, t + 0.02, 0.06, 0.18);
  }

  pop(tileIndex = 0) {
    const [ctx, t] = this._ready();
    const freq = 520 + tileIndex * 40;
    this._osc(ctx, 'sine', freq, t, 0.22, 0.06);
    this._noise(ctx, t, 0.015, 0.15, 4000, 'highpass');
  }

  specialCreate() {
    const [ctx, t] = this._ready();
    [[523, 0], [659, 0.1], [784, 0.2]].forEach(([f, delay]) => {
      this._osc(ctx, 'triangle', f, t + delay, 0.3, 0.28);
    });
  }

  specialActivate(type) {
    const [ctx, t] = this._ready();
    switch (type) {
      case 'bolibompa':     this._sfxBolibompa(ctx, t);     break;
      case 'pippi':         this._sfxPippi(ctx, t);         break;
      case 'ratatoskr':     this._sfxRatatoskr(ctx, t);     break;
      case 'sommarskuggan': this._sfxSommarskuggan(ctx, t); break;
    }
  }

  levelComplete() {
    const [ctx, t] = this._ready();
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]].forEach(([f, delay]) => {
      this._osc(ctx, 'triangle', f, t + delay, 0.55, 0.38);
    });
  }

  fail() {
    const [ctx, t] = this._ready();
    [[320, 0], [254, 0.16], [180, 0.32]].forEach(([f, delay]) => {
      this._osc(ctx, 'sawtooth', f, t + delay, 0.25, 0.22);
    });
  }

  blockerCrack() {
    const [ctx, t] = this._ready();
    this._noise(ctx, t, 0.08, 0.45, 1200, 'bandpass');
    this._noise(ctx, t, 0.04, 0.20, 4000, 'highpass');
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

  _sfxBolibompa(ctx, t) {
    this._osc(ctx, 'sawtooth', 90,  t,        0.45, 0.35, 40);
    this._osc(ctx, 'sawtooth', 180, t,        0.25, 0.35, 60);
    this._noise(ctx, t,        0.55, 0.30, 220, 'bandpass');
    this._noise(ctx, t + 0.05, 0.30, 0.15, 800, 'bandpass');
  }

  _sfxPippi(ctx, t) {
    this._osc(ctx, 'sawtooth', 140, t,        0.40, 0.28, 900);
    this._osc(ctx, 'triangle', 280, t + 0.05, 0.20, 0.22, 1200);
    this._noise(ctx, t, 0.15, 0.28, 3000, 'highpass');
  }

  _sfxRatatoskr(ctx, t) {
    [360, 450, 570, 720, 900].forEach((f, i) => {
      this._osc(ctx, 'square', f, t + i * 0.055, 0.18, 0.08);
    });
  }

  _sfxSommarskuggan(ctx, t) {
    this._osc(ctx, 'sine',     100, t,        0.45, 0.55, 55);
    this._osc(ctx, 'sine',     150, t + 0.05, 0.30, 0.45, 80);
    this._osc(ctx, 'triangle', 200, t + 0.10, 0.20, 0.35, 100);
    this._noise(ctx, t, 0.18, 0.55, 180, 'lowpass');
  }

  // ── Music scheduler ────────────────────────────────────────────────────────

  _scheduleMusic() {
    if (!this._musicRun) return;
    const ctx     = this._getCtx();
    const gain    = 0.045;
    const mult    = this._tempoMult;
    const pattern = this._currentPattern;

    let offset = 0;
    for (const [freq, dur] of pattern) {
      const scaledDur = dur * mult;
      if (freq > 0) {
        const t = this._musicBeat + offset;
        this._osc(ctx, 'triangle', freq, t, gain, scaledDur * 0.85);
        if (offset === 0) this._osc(ctx, 'sine', freq / 2, t, gain * 0.6, scaledDur * 0.9);
      }
      offset += scaledDur;
    }

    this._musicBeat += offset;

    const msUntilReschedule = (this._musicBeat - ctx.currentTime - 0.6) * 1000;
    this._musicTimer = setTimeout(
      () => this._scheduleMusic(),
      Math.max(0, msUntilReschedule),
    );
  }
}

export const Snd = new AudioManager();
