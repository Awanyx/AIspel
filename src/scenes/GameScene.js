import Phaser from 'phaser';
import { Board } from '../game/Board.js';
import {
  COLS, ROWS, TILE_SIZE, TILE_STEP,
  BOARD_ORIGIN_X, BOARD_ORIGIN_Y,
  SWIPE_THRESHOLD, SWAP_DURATION, INVALID_SWAP_DURATION,
  FALL_DURATION_BASE, FALL_DURATION_PER_PX, POP_DURATION, CASCADE_PAUSE,
  GAME_WIDTH, GAME_HEIGHT, TILE_COLORS, TILE_TYPES,
} from '../game/constants.js';
import { getLevel } from '../game/levels.js';
import { Snd } from '../game/Audio.js';

// Glow colour per special type
const SPECIAL_GLOW = {
  bolibompa:     0xe74c3c, // fire-red
  pippi:         0xff8c00, // orange
  ratatoskr:     0xd4652a, // warm brown
  sommarskuggan: 0x4040cc, // deep blue
};

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) { this.levelId = data?.levelId ?? 1; }

  create() {
    this.level   = getLevel(this.levelId);
    this.board   = new Board(this.level.tileTypes ?? TILE_TYPES);
    this.board.initBlockers(this.level.blockerPositions ?? []);
    this.tileSprites     = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.specialOverlays = {};   // "row,col" → Graphics (glow ring)
    this.blockerOverlays = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.busy   = false;
    this._ended = false;
    this.score  = 0;

    // Score-type / blockers-type state
    this.moves = this.level.objective.moves ?? null;

    // Time-attack state
    this._timeLeft = this.level.objective.seconds ?? 0;
    this._timerEvent = null;

    // Null out HUD refs so stale destroyed objects from a previous session
    // don't cause setText() calls to throw in _updateHUD().
    this.scoreText       = null;
    this.movesText       = null;
    this.timerText       = null;
    this.blockerCountText = null;
    this._scoreBarFill   = null;
    this._scoreBarMeta   = null;
    this._movesWarnActive = false;
    this._hintHighlights = [];
    this._hintTween      = null;

    this._drawBackground();
    this._drawBoardBackground();
    this._buildSprites();
    this._buildBlockerOverlays();
    this._setupHUD();
    this._setupInput();
    this._setupAnimations();

    Snd.startMusic(this.levelId);
    if (this.level.objective.type === 'time') this._startTimer();
  }

  // ─── Special animations ───────────────────────────────────────────────────

  _setupAnimations() {
    const fps = { bolibompa: 12, pippi: 14, ratatoskr: 16, sommarskuggan: 10 };
    for (const [type, frameRate] of Object.entries(fps)) {
      const key = `anim_${type}`;
      // frameTotal > 1 means the spritesheet loaded correctly (not a missing-texture placeholder)
      if (this.textures.get(key).frameTotal > 1 && !this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
          frameRate,
          repeat: 0,
        });
      }
    }
  }

  _playSpecialAnimation(row, col, type) {
    const key = `anim_${type}`;
    if (!this.anims.exists(key)) return;
    const { x, y } = this._tileXY(row, col);
    const spr = this.add.sprite(x, y, key).setDisplaySize(200, 200).setDepth(6);
    spr.play(key);
    spr.once('animationcomplete', () => spr.destroy());
  }

  // ─── Background ──────────────────────────────────────────────────────────

  _drawBackground() {
    const key = `level_bg_${this.levelId}`;
    const t = this.textures.get(key);
    if (t && t.source.length > 0 && t.source[0].width > 32) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b5e, 0x2d1b5e, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  _drawBoardBackground() {
    const pad = 6;
    const bw = COLS * TILE_STEP - TILE_STEP + TILE_SIZE + pad * 2;
    const bh = ROWS * TILE_STEP - TILE_STEP + TILE_SIZE + pad * 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(BOARD_ORIGIN_X - pad, BOARD_ORIGIN_Y - pad, bw, bh, 12);
    g.lineStyle(1, 0xffffff, 0.08);
    g.strokeRoundedRect(BOARD_ORIGIN_X - pad, BOARD_ORIGIN_Y - pad, bw, bh, 12);
  }

  // ─── Sprites ─────────────────────────────────────────────────────────────

  _buildSprites() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        this._createSprite(r, c, this.board.get(r, c));
  }

  _createSprite(row, col, type) {
    const { x, y } = this._tileXY(row, col);
    const img = this.add.image(x, y, `tile_${type}`);
    // Scale to fit TILE_SIZE regardless of source resolution
    img.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.tileSprites[row][col] = img;
    return img;
  }

  _tileXY(row, col) {
    return {
      x: BOARD_ORIGIN_X + col * TILE_STEP + TILE_SIZE / 2,
      y: BOARD_ORIGIN_Y + row * TILE_STEP + TILE_SIZE / 2,
    };
  }

  _spawnY(col) {
    return { x: BOARD_ORIGIN_X + col * TILE_STEP + TILE_SIZE / 2, y: BOARD_ORIGIN_Y - TILE_STEP };
  }

  // ─── Blocker overlays ────────────────────────────────────────────────────

  _buildBlockerOverlays() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this.board.isBlocker(r, c)) this._createBlockerOverlay(r, c);
  }

  _createBlockerOverlay(row, col) {
    const { x, y } = this._tileXY(row, col);
    const bt = this.textures.get('tile_blocker');
    if (bt && bt.source.length > 0 && bt.source[0].width > 32) {
      const spr = this.add.image(x, y, 'tile_blocker').setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(2);
      this.blockerOverlays[row][col] = spr;
    } else {
      const g = this.add.graphics();
      const half = TILE_SIZE / 2 - 1;
      g.fillStyle(0x000000, 0.55);
      g.fillRoundedRect(x - half, y - half, TILE_SIZE - 2, TILE_SIZE - 2, 8);
      g.lineStyle(2, 0x8888aa, 0.8);
      g.lineBetween(x - half + 4, y - half + 4, x + half - 4, y + half - 4);
      g.lineBetween(x + half - 4, y - half + 4, x - half + 4, y + half - 4);
      g.lineStyle(2, 0xaaaacc, 0.5);
      g.strokeRoundedRect(x - half, y - half, TILE_SIZE - 2, TILE_SIZE - 2, 8);
      this.blockerOverlays[row][col] = g;
    }
  }

  _destroyBlockerOverlay(row, col) {
    const g = this.blockerOverlays[row][col];
    if (!g) return;
    this.tweens.add({
      targets: g, alpha: 0, scaleX: 1.4, scaleY: 1.4,
      duration: 200, ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
    this.blockerOverlays[row][col] = null;
    this._updateBlockerHUD();
  }

  // ─── Special overlays ────────────────────────────────────────────────────

  _createSpecialOverlay(row, col) {
    const type = this.board.specialType(row, col);
    if (!type) return;
    const key = `${row},${col}`;
    if (this.specialOverlays[key]) { this.specialOverlays[key].destroy(); }

    const { x, y } = this._tileXY(row, col);

    const frameKey = `special_${type}`;
    const ft = this.textures.get(frameKey);
    if (ft && ft.source.length > 0 && ft.source[0].width > 32) {
      const spr = this.add.image(x, y, frameKey).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(3);
      this.tweens.add({ targets: spr, alpha: 0.5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.specialOverlays[key] = spr;
    } else {
      const half = TILE_SIZE / 2 - 1;
      const color = SPECIAL_GLOW[type];
      const g = this.add.graphics();
      g.lineStyle(3, color, 1);
      g.strokeRoundedRect(x - half, y - half, TILE_SIZE - 2, TILE_SIZE - 2, 8);
      g.fillStyle(color, 0.25);
      g.fillRoundedRect(x - half, y - half, TILE_SIZE - 2, TILE_SIZE - 2, 8);
      g.fillStyle(color, 1);
      g.fillCircle(x + half - 5, y - half + 5, 4);
      this.tweens.add({ targets: g, alpha: 0.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.specialOverlays[key] = g;
    }
  }

  _removeSpecialOverlay(row, col) {
    const key = `${row},${col}`;
    if (this.specialOverlays[key]) { this.specialOverlays[key].destroy(); delete this.specialOverlays[key]; }
  }

  /** Move an overlay from one cell to another (called when tile falls). */
  _moveSpecialOverlay(fromRow, fromCol, toRow, toCol) {
    const key = `${fromRow},${fromCol}`;
    if (!this.specialOverlays[key]) return;
    // Easiest: destroy and recreate at new position (board.specials already updated by applyGravity)
    this.specialOverlays[key].destroy();
    delete this.specialOverlays[key];
    // Will be recreated after the fall tween via _rebuildSpecialOverlays
  }

  _rebuildSpecialOverlays() {
    // Destroy all existing
    for (const g of Object.values(this.specialOverlays)) g?.destroy();
    this.specialOverlays = {};
    // Recreate from board state
    for (const key of Object.keys(this.board.specials)) {
      const [r, c] = key.split(',').map(Number);
      this._createSpecialOverlay(r, c);
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  _setupHUD() {
    const cx  = GAME_WIDTH / 2;
    const obj = this.level.objective;

    this.add.text(cx, 28, this.level.label.toUpperCase(), {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    // Score (always shown)
    this.scoreText = this.add.text(30, 72, '0', {
      fontSize: '30px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add.text(30, 92, 'POÄNG', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#888899',
    }).setOrigin(0, 0.5);

    if (obj.type === 'score') {
      this._setupScoreHUD(cx, obj.target);
      this._setupMoveHUD();
    } else if (obj.type === 'blockers') {
      this._setupBlockerHUD(cx);
      this._setupMoveHUD();
    } else if (obj.type === 'time') {
      this._setupTimerHUD(cx);
      this._setupScoreTarget(cx, obj.target);
    }

    // Back button
    this.add.text(30, 30, '←', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { if (!this._ended) { this._stopTimer(); this.scene.start('MapScene'); } });

    // Hint button — bottom-left corner of board area
    this._hintHighlights = [];
    this._hintTween = null;
    const hintBtn = this.add.text(30, GAME_HEIGHT - 36, '💡', {
      fontSize: '26px',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this._showHint());

    // Mute toggle
    this._muteBtn = this.add.text(GAME_WIDTH - 30, 28, Snd.muted ? '🔇' : '🔊', {
      fontSize: '20px',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        Snd.toggle();
        this._muteBtn.setText(Snd.muted ? '🔇' : '🔊');
      });
  }

  _setupScoreHUD(cx, target) {
    const barW = 160; const barH = 10; const barX = cx - barW / 2; const barY = 66;
    this.add.graphics().fillStyle(0x000000, 0.4).fillRoundedRect(barX, barY, barW, barH, 4);
    this._scoreBarFill = this.add.graphics();
    this._scoreBarMeta = { x: barX, y: barY, w: barW, h: barH, target };
    this.add.text(cx + barW / 2 + 6, barY + barH / 2, `/${target}`, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#888899',
    }).setOrigin(0, 0.5);
  }

  _setupBlockerHUD(cx) {
    this.add.text(cx, 58, 'BLOCKERARE', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);
    this.blockerCountText = this.add.text(cx, 78, String(this.board.blockerCount()), {
      fontSize: '26px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#e8b4f0',
    }).setOrigin(0.5);
  }

  _setupTimerHUD(cx) {
    this.add.text(cx, 58, 'TID', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);
    this.timerText = this.add.text(cx, 82, this._formatTime(this._timeLeft), {
      fontSize: '32px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#e8b4f0',
    }).setOrigin(0.5);
  }

  _setupScoreTarget(cx, target) {
    this.add.text(GAME_WIDTH - 30, 58, 'MÅL', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(1, 0.5);
    this.add.text(GAME_WIDTH - 30, 78, String(target), {
      fontSize: '18px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#888899',
    }).setOrigin(1, 0.5);
  }

  _setupMoveHUD() {
    this.movesText = this.add.text(GAME_WIDTH - 30, 72, String(this.moves), {
      fontSize: '30px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#e8b4f0',
    }).setOrigin(1, 0.5);
    this.add.text(GAME_WIDTH - 30, 92, 'DRAG', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#888899',
    }).setOrigin(1, 0.5);
    this._movesWarnActive = false;
  }

  _updateHUD() {
    this.scoreText?.setText(String(this.score));
    this.movesText?.setText(String(this.moves));
    this.timerText?.setText(this._formatTime(this._timeLeft));

    if (this._scoreBarMeta) {
      const { x, y, w, h, target } = this._scoreBarMeta;
      const pct = Math.min(this.score / target, 1);
      this._scoreBarFill.clear();
      if (pct > 0) { this._scoreBarFill.fillStyle(0x9b59b6, 1); this._scoreBarFill.fillRoundedRect(x, y, w * pct, h, 4); }
    }

    // Low-moves warning: pulse red when ≤ 5 moves left
    if (this.movesText && this.moves !== null) {
      if (this.moves <= 5 && this.moves > 0 && !this._movesWarnActive) {
        this._movesWarnActive = true;
        Snd.setUrgency(true);
        this.movesText.setColor('#ff4444');
        this.tweens.add({
          targets: this.movesText,
          scaleX: 1.25, scaleY: 1.25,
          duration: 280, ease: 'Sine.easeInOut',
          yoyo: true, repeat: -1,
        });
      } else if (this.moves > 5 && this._movesWarnActive) {
        this._movesWarnActive = false;
        this.tweens.killTweensOf(this.movesText);
        this.movesText.setScale(1).setColor('#e8b4f0');
      }
    }
  }

  _updateBlockerHUD() {
    this.blockerCountText?.setText(String(this.board.blockerCount()));
  }

  _formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  _startTimer() {
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this._timeLeft = Math.max(0, this._timeLeft - 1);
        this._updateHUD();
        // Flash timer red in last 10 seconds
        if (this._timeLeft <= 10) {
          Snd.setUrgency(true);
          if (this.timerText) this.timerText.setColor(this._timeLeft % 2 === 0 ? '#ff4444' : '#e8b4f0');
        }
        if (this._timeLeft <= 0) this._checkEndCondition();
      },
      repeat: this.level.objective.seconds - 1,
    });
  }

  _stopTimer() {
    this._timerEvent?.remove();
    this._timerEvent = null;
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  _setupInput() {
    let startX = 0, startY = 0;
    this.input.on('pointerdown', (p) => {
      Snd.resume(); // unlock AudioContext on first gesture
      startX = p.x; startY = p.y;
    });
    this.input.on('pointerup', (p) => {
      if (this.busy || this._ended) return;
      const dx = p.x - startX, dy = p.y - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const tile = this._tileAtPos(startX, startY);
      if (tile) this._handleSwipe(tile.row, tile.col, dir);
    });
  }

  _tileAtPos(sx, sy) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const { x, y } = this._tileXY(r, c);
        if (Math.abs(sx - x) <= TILE_SIZE / 2 && Math.abs(sy - y) <= TILE_SIZE / 2) return { row: r, col: c };
      }
    return null;
  }

  // ─── Swap ─────────────────────────────────────────────────────────────────

  _handleSwipe(row, col, dir) {
    const d = { up:[-1,0], down:[1,0], left:[0,-1], right:[0,1] }[dir];
    const r2 = row + d[0], c2 = col + d[1];
    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return;

    if (this.board.wouldMatch(row, col, r2, c2)) {
      this._doSwap(row, col, r2, c2);
    } else {
      this._invalidSwap(row, col, r2, c2);
    }
  }

  _doSwap(r1, c1, r2, c2) {
    this.busy = true;
    this._clearHint();
    Snd.swap();
    this.board.swap(r1, c1, r2, c2);

    const sprA = this.tileSprites[r1][c1], sprB = this.tileSprites[r2][c2];
    const posA = this._tileXY(r1, c1), posB = this._tileXY(r2, c2);
    this.tileSprites[r1][c1] = sprB; this.tileSprites[r2][c2] = sprA;

    // Swap special overlay keys too
    const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;
    const ov1 = this.specialOverlays[k1], ov2 = this.specialOverlays[k2];
    if (ov1) this.specialOverlays[k2] = ov1; else delete this.specialOverlays[k2];
    if (ov2) this.specialOverlays[k1] = ov2; else delete this.specialOverlays[k1];

    this.tweens.add({ targets: sprA, x: posB.x, y: posB.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut' });
    if (ov1) this.tweens.add({ targets: ov1, x: posB.x - posA.x, y: posB.y - posA.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut' });
    if (ov2) this.tweens.add({ targets: ov2, x: posA.x - posB.x, y: posA.y - posB.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut' });
    this.tweens.add({
      targets: sprB, x: posA.x, y: posA.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.moves !== null) { this.moves--; this._updateHUD(); }
        this._processMatches(0);
      },
    });
  }

  _invalidSwap(r1, c1, r2, c2) {
    this.busy = true;
    const sprA = this.tileSprites[r1][c1], sprB = this.tileSprites[r2][c2];
    const posA = this._tileXY(r1, c1), posB = this._tileXY(r2, c2);
    const nudge = 0.35;
    this.tweens.add({
      targets: sprA, x: posA.x + (posB.x - posA.x) * nudge, y: posA.y + (posB.y - posA.y) * nudge,
      duration: INVALID_SWAP_DURATION * 0.4, ease: 'Sine.easeOut', yoyo: true,
      onComplete: () => { this.busy = false; },
    });
    this.tweens.add({
      targets: sprB, x: posB.x + (posA.x - posB.x) * nudge, y: posB.y + (posA.y - posB.y) * nudge,
      duration: INVALID_SWAP_DURATION * 0.4, ease: 'Sine.easeOut', yoyo: true,
    });
  }

  // ─── Match processing loop ────────────────────────────────────────────────

  _processMatches(cascadeLevel) {
    const matchCells = this.board.findMatches();
    if (matchCells.length === 0) {
      this.busy = false;
      if (!this._ended && !this.board.hasValidMove()) {
        this._shuffleBoard();
        return;
      }
      this._checkEndCondition();
      return;
    }

    // ── 1. Collect special activations ──────────────────────────────────────
    const activatedSpecials = [];
    let extraCells = [];
    for (const { row, col } of matchCells) {
      if (this.board.isSpecial(row, col)) {
        activatedSpecials.push({ row, col, type: this.board.specialType(row, col) });
        extraCells.push(...this.board.computeSpecialEffect(row, col));
      }
    }

    // ── 2. Detect new specials to create (before any removal) ───────────────
    const newSpecials = this.board.detectSpecials(matchCells);

    // ── 3. Merge all cells to clear (deduplicated) ───────────────────────────
    const clearSet = new Map();
    for (const c of [...matchCells, ...extraCells]) clearSet.set(`${c.row},${c.col}`, c);
    const allClear = [...clearSet.values()];

    // Filter new specials: don't create at a position being cleared by an effect
    const clearKeys = new Set(clearSet.keys());
    // Remove cells that are null (extra effect cells that may be off-board or already null)
    const validClear = allClear.filter(({ row, col }) => this.board.get(row, col) !== null);
    const validNewSpecials = newSpecials.filter(s => !clearKeys.has(`${s.row},${s.col}`) || matchCells.some(m => m.row === s.row && m.col === s.col));

    // ── 4. Score ────────────────────────────────────────────────────────────
    const multiplier = Math.max(1, cascadeLevel);   // +1× per cascade (was 1.5^n)
    this.score += validClear.length * 20 * multiplier;
    this._updateHUD();

    // ── 5. Activate visual flash for special effects ────────────────────────
    for (const { row, col, type } of activatedSpecials) {
      this._flashSpecialEffect(row, col, type);
      this._removeSpecialOverlay(row, col);
      Snd.specialActivate(type);
      this._playSpecialAnimation(row, col, type);
    }

    // ── 6. Animate pop ──────────────────────────────────────────────────────
    // Cells becoming specials stay on board; only clearCells (minus kept) are popped
    const keptAsSpecial = new Set(validNewSpecials.map(s => `${s.row},${s.col}`));
    const cellsToRemove = validClear.filter(c => !keptAsSpecial.has(`${c.row},${c.col}`));

    this._animatePop(cellsToRemove, () => {
      // ── 7. Mutate board ──────────────────────────────────────────────────
      const { falls, destroyedBlockers } = this.board.removeAndCreateSpecials(validClear, validNewSpecials);
      const spawns = this.board.fillEmpty();

      // Destroy removed sprites
      for (const { row, col } of cellsToRemove) {
        this.tileSprites[row][col]?.destroy();
        this.tileSprites[row][col] = null;
        this._removeSpecialOverlay(row, col);
      }

      // Destroy blocker overlays that were cleared
      for (const { row, col } of destroyedBlockers) {
        this._destroyBlockerOverlay(row, col);
        Snd.blockerCrack();
      }

      // Animate falling tiles
      let maxFallDur = 0;
      for (const { col, toRow, fromRow } of falls) {
        const spr = this.tileSprites[fromRow][col];
        if (!spr) continue;
        this.tileSprites[toRow][col] = spr;
        this.tileSprites[fromRow][col] = null;
        const { y: targetY } = this._tileXY(toRow, col);
        const dist = Math.abs(targetY - spr.y);
        const dur = FALL_DURATION_BASE + dist * FALL_DURATION_PER_PX;
        if (dur > maxFallDur) maxFallDur = dur;
        this._animateFall(spr, targetY, dur);
        // Also move blocker overlay if present
        const bov = this.blockerOverlays[fromRow][col];
        if (bov) { this.blockerOverlays[toRow][col] = bov; this.blockerOverlays[fromRow][col] = null; this.tweens.add({ targets: bov, y: `+=${targetY - spr.y}`, duration: dur, ease: 'Quad.easeIn' }); }
      }

      // Spawn new tiles
      for (const { col, row, type } of spawns) {
        const { x: sx, y: sy } = this._spawnY(col);
        const spr = this.add.image(sx, sy, `tile_${type}`).setDisplaySize(TILE_SIZE, TILE_SIZE);
        this.tileSprites[row][col] = spr;
        const { y: targetY } = this._tileXY(row, col);
        const dist = Math.abs(targetY - sy);
        const dur = FALL_DURATION_BASE + dist * FALL_DURATION_PER_PX;
        if (dur > maxFallDur) maxFallDur = dur;
        this._animateFall(spr, targetY, dur);
      }

      // Rebuild special overlays after all falls, then burst newly created ones
      this.time.delayedCall(maxFallDur + 50, () => {
        this._rebuildSpecialOverlays();
        // Burst only for specials that were just created this pass
        let anyNew = false;
        for (const { type, row, col } of validNewSpecials) {
          if (this.board.specialType(row, col) === type) {
            const { x, y } = this._tileXY(row, col);
            this._emitSpecialBurst(x, y, SPECIAL_GLOW[type]);
            anyNew = true;
          }
        }
        if (anyNew) Snd.specialCreate();
        this.time.delayedCall(CASCADE_PAUSE, () => this._processMatches(cascadeLevel + 1));
      });
    });
  }

  // ─── Visual effects ───────────────────────────────────────────────────────

  _animatePop(cells, onComplete) {
    if (cells.length === 0) { onComplete(); return; }
    let remaining = cells.length;
    const done = () => { if (--remaining === 0) onComplete(); };
    let idx = 0;
    for (const { row, col } of cells) {
      const spr = this.tileSprites[row][col];
      if (!spr) { done(); continue; }

      Snd.pop(idx++);

      // Particle burst at the tile's position, coloured to match tile type
      const type = this.board.get(row, col);
      if (type !== null) this._emitPopParticles(spr.x, spr.y, TILE_COLORS[type]);

      this.tweens.add({
        targets: spr, scaleX: 1.3, scaleY: 1.3, alpha: 0,
        duration: POP_DURATION, ease: 'Cubic.easeOut', onComplete: done,
      });
    }
  }

  /** Fall tween with squash-and-stretch on landing. */
  _animateFall(spr, targetY, dur) {
    this.tweens.add({
      targets: spr, y: targetY, duration: dur, ease: 'Quad.easeIn',
      onComplete: () => {
        // Capture scale AFTER setDisplaySize so we multiply from the correct base
        const sx = spr.scaleX, sy = spr.scaleY;
        this.tweens.add({
          targets: spr, scaleX: sx * 1.25, scaleY: sy * 0.75, duration: 60, ease: 'Sine.easeOut',
          onComplete: () => {
            this.tweens.add({ targets: spr, scaleX: sx, scaleY: sy, duration: 140, ease: 'Back.easeOut' });
          },
        });
      },
    });
  }

  /**
   * Burst of coloured dots flying outward from (x, y).
   * Used for normal tile pops.
   */
  _emitPopParticles(x, y, color) {
    const emitter = this.add.particles(x, y, 'particle', {
      speed:    { min: 60, max: 200 },
      angle:    { min: 0, max: 360 },
      scale:    { start: 1.0, end: 0 },
      alpha:    { start: 1,   end: 0 },
      lifespan: { min: 220,   max: 420 },
      gravityY: 220,
      tint: color,
      emitting: false,
    });
    emitter.explode(10, x, y);
    // Destroy the emitter once all particles have died
    this.time.delayedCall(500, () => emitter.destroy());
  }

  /**
   * Larger burst of gold + special-colour sparks when a special tile
   * is created (called once per newly placed special after gravity).
   */
  _emitSpecialBurst(x, y, color) {
    const emitter = this.add.particles(x, y, 'particle', {
      speed:    { min: 80, max: 240 },
      angle:    { min: 0, max: 360 },
      scale:    { start: 1.4, end: 0 },
      alpha:    { start: 1,   end: 0 },
      lifespan: { min: 300,   max: 550 },
      gravityY: 160,
      tint: [color, 0xffd700, 0xffffff],
      emitting: false,
    });
    emitter.explode(16, x, y);
    this.time.delayedCall(650, () => emitter.destroy());
  }

  _flashSpecialEffect(row, col, type) {
    const { x, y } = this._tileXY(row, col);
    const color = SPECIAL_GLOW[type] ?? 0xffffff;

    // Compute affected area for the flash overlay
    let cells = [{ row, col }, ...this.board.computeSpecialEffect(row, col)];
    if (!cells.length) return;

    const xs = cells.map(c => this._tileXY(c.row, c.col).x);
    const ys = cells.map(c => this._tileXY(c.row, c.col).y);
    const minX = Math.min(...xs) - TILE_SIZE / 2;
    const minY = Math.min(...ys) - TILE_SIZE / 2;
    const maxX = Math.max(...xs) + TILE_SIZE / 2;
    const maxY = Math.max(...ys) + TILE_SIZE / 2;

    const flash = this.add.graphics().setDepth(5);
    flash.fillStyle(color, 0.55);
    flash.fillRoundedRect(minX, minY, maxX - minX, maxY - minY, 8);
    this.tweens.add({ targets: flash, alpha: 0, duration: 350, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
  }

  // ─── Hint ────────────────────────────────────────────────────────────────

  _clearHint() {
    if (this._hintTween) { this._hintTween.stop(); this._hintTween = null; }
    for (const g of this._hintHighlights) g.destroy();
    this._hintHighlights = [];
  }

  _showHint() {
    if (this.busy || this._ended) return;
    this._clearHint();

    const hint = this.board.findHint();
    if (!hint) return;

    const { r1, c1, r2, c2 } = hint;
    const positions = [{ row: r1, col: c1 }, { row: r2, col: c2 }];

    for (const { row, col } of positions) {
      const { x, y } = this._tileXY(row, col);
      const g = this.add.graphics().setDepth(10);
      g.lineStyle(3, 0xffdd00, 1);
      g.strokeRoundedRect(x - TILE_SIZE / 2 + 1, y - TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2, 6);
      this._hintHighlights.push(g);
    }

    // Pulse the highlights for 2.5 s then fade out
    this._hintTween = this.tweens.add({
      targets: this._hintHighlights,
      alpha: { from: 1, to: 0.2 },
      duration: 400, yoyo: true, repeat: 4,
      onComplete: () => this._clearHint(),
    });
  }

  // ─── Shuffle ─────────────────────────────────────────────────────────────

  _shuffleBoard() {
    this.busy = true;

    const cx = GAME_WIDTH / 2;
    const toast = this.add.text(cx, GAME_HEIGHT / 2, 'BLANDAR…', {
      fontSize: '24px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff', stroke: '#9b59b6', strokeThickness: 4,
      backgroundColor: '#00000099', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.tweens.add({ targets: toast, alpha: 1, duration: 200 });

    // Collect all live tile sprites
    const sprites = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this.tileSprites[r][c]) sprites.push(this.tileSprites[r][c]);

    this.tweens.add({
      targets: sprites, alpha: 0, duration: 280, ease: 'Sine.easeIn',
      onComplete: () => {
        this.board.reshuffleUntilMovable();

        // Update every sprite texture to match the new board positions
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++) {
            const spr = this.tileSprites[r][c];
            if (!spr) continue;
            const type = this.board.get(r, c);
            if (type !== null) spr.setTexture(`tile_${type}`).setDisplaySize(TILE_SIZE, TILE_SIZE);
          }

        this._rebuildSpecialOverlays();

        const toFadeIn = [];
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (this.tileSprites[r][c]) toFadeIn.push(this.tileSprites[r][c]);

        this.tweens.add({
          targets: toFadeIn, alpha: 1, duration: 300, ease: 'Sine.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: toast, alpha: 0, delay: 400, duration: 200,
              onComplete: () => toast.destroy(),
            });
            this.busy = false;
            // If still no valid move after reshuffle, chain another shuffle
            if (!this._ended && !this.board.hasValidMove()) {
              this._shuffleBoard();
            } else {
              this._checkEndCondition();
            }
          },
        });
      },
    });
  }

  // ─── End conditions ───────────────────────────────────────────────────────

  _checkEndCondition() {
    if (this._ended) return;
    const { type, target } = this.level.objective;

    let won  = false;
    let lost = false;
    let reason = '';

    if (type === 'score') {
      won  = this.score >= target;
      lost = !won && this.moves <= 0;
      reason = 'Inga drag kvar!';
    } else if (type === 'blockers') {
      won  = this.board.blockerCount() === 0;
      lost = !won && this.moves <= 0;
      reason = 'Inga drag kvar!';
    } else if (type === 'time') {
      won  = this.score >= target;
      lost = !won && this._timeLeft <= 0;
      reason = 'Tiden är ute!';
    }

    if (won) {
      this._ended = true;
      this._stopTimer();
      // +20 pts per remaining move for move-limited objectives
      if ((type === 'score' || type === 'blockers') && this.moves > 0) {
        this.score += this.moves * 20;
        this._updateHUD();
      }
      this.time.delayedCall(400, () => this.scene.start('WinScene', { levelId: this.levelId, score: this.score }));
    } else if (lost) {
      this._ended = true;
      this._stopTimer();
      this.time.delayedCall(400, () => this.scene.start('FailScene', { levelId: this.levelId, score: this.score, reason }));
    }
  }
}
