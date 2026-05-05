import Phaser from 'phaser';
import { Board } from '../game/Board.js';
import {
  COLS, ROWS,
  TILE_SIZE, TILE_STEP,
  BOARD_ORIGIN_X, BOARD_ORIGIN_Y,
  SWIPE_THRESHOLD,
  SWAP_DURATION, INVALID_SWAP_DURATION,
  FALL_DURATION_BASE, FALL_DURATION_PER_PX,
  POP_DURATION, CASCADE_PAUSE,
  GAME_WIDTH, GAME_HEIGHT,
} from '../game/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.board = new Board();
    this.tileSprites = [];   // tileSprites[row][col] = Phaser.GameObjects.Image
    this.busy = false;       // lock input while animations run
    this.score = 0;
    this.moves = 30;

    this._drawBackground();
    this._drawBoardBackground();
    this._buildSprites();
    this._setupHUD();
    this._setupInput();
  }

  // ─── Background ────────────────────────────────────────────────────────────

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b5e, 0x2d1b5e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  _drawBoardBackground() {
    const pad = 6;
    const boardW = COLS * TILE_STEP - TILE_SIZE + TILE_SIZE + pad * 2;
    const boardH = ROWS * TILE_STEP - TILE_SIZE + TILE_SIZE + pad * 2;
    const bx = BOARD_ORIGIN_X - pad;
    const by = BOARD_ORIGIN_Y - pad;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(bx, by, boardW, boardH, 12);
    g.lineStyle(1, 0xffffff, 0.08);
    g.strokeRoundedRect(bx, by, boardW, boardH, 12);
  }

  // ─── Sprite grid ───────────────────────────────────────────────────────────

  _buildSprites() {
    this.tileSprites = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this._createSprite(r, c, this.board.get(r, c));
      }
    }
  }

  _createSprite(row, col, type) {
    const { x, y } = this._tileXY(row, col);
    const img = this.add.image(x, y, `tile_${type}`)
      .setDisplaySize(TILE_SIZE, TILE_SIZE)
      .setData('row', row)
      .setData('col', col)
      .setData('type', type);
    this.tileSprites[row][col] = img;
    return img;
  }

  _tileXY(row, col) {
    return {
      x: BOARD_ORIGIN_X + col * TILE_STEP + TILE_SIZE / 2,
      y: BOARD_ORIGIN_Y + row * TILE_STEP + TILE_SIZE / 2,
    };
  }

  _spawnAboveBoard(col) {
    return {
      x: BOARD_ORIGIN_X + col * TILE_STEP + TILE_SIZE / 2,
      y: BOARD_ORIGIN_Y - TILE_STEP,
    };
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  _setupHUD() {
    const cx = GAME_WIDTH / 2;

    // Score
    this.scoreLabelText = this.add.text(cx, 60, 'SCORE', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(cx, 82, '0', {
      fontSize: '32px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);

    // Moves
    this.movesLabelText = this.add.text(GAME_WIDTH - 48, 60, 'MOVES', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    this.movesText = this.add.text(GAME_WIDTH - 48, 82, String(this.moves), {
      fontSize: '32px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#e8b4f0',
    }).setOrigin(0.5);

    // Back to menu
    const backText = this.add.text(30, 60, '←', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerup', () => this.scene.start('MenuScene'));
  }

  _updateHUD() {
    this.scoreText.setText(String(this.score));
    this.movesText.setText(String(this.moves));
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    let startX = 0;
    let startY = 0;

    this.input.on('pointerdown', (pointer) => {
      startX = pointer.x;
      startY = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      if (this.busy) return;

      const dx = pointer.x - startX;
      const dy = pointer.y - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

      const direction = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');

      const tile = this._tileAtScreenPos(startX, startY);
      if (tile) this._handleSwipe(tile.row, tile.col, direction);
    });
  }

  _tileAtScreenPos(sx, sy) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = this._tileXY(r, c);
        if (Math.abs(sx - x) <= TILE_SIZE / 2 && Math.abs(sy - y) <= TILE_SIZE / 2) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  // ─── Game logic ────────────────────────────────────────────────────────────

  _handleSwipe(row, col, direction) {
    const deltas = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    const [dr, dc] = deltas[direction];
    const r2 = row + dr;
    const c2 = col + dc;

    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return;

    if (this.board.wouldMatch(row, col, r2, c2)) {
      this._doSwap(row, col, r2, c2, true);
    } else {
      this._animateInvalidSwap(row, col, r2, c2);
    }
  }

  _doSwap(r1, c1, r2, c2, consumeMove) {
    this.busy = true;
    this.board.swap(r1, c1, r2, c2);

    const sprA = this.tileSprites[r1][c1];
    const sprB = this.tileSprites[r2][c2];
    const posA = this._tileXY(r1, c1);
    const posB = this._tileXY(r2, c2);

    this.tileSprites[r1][c1] = sprB;
    this.tileSprites[r2][c2] = sprA;

    this.tweens.add({ targets: sprA, x: posB.x, y: posB.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut' });
    this.tweens.add({
      targets: sprB, x: posA.x, y: posA.y, duration: SWAP_DURATION, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (consumeMove) {
          this.moves--;
          this._updateHUD();
        }
        this._processMatches(0);
      },
    });
  }

  _animateInvalidSwap(r1, c1, r2, c2) {
    this.busy = true;
    const sprA = this.tileSprites[r1][c1];
    const sprB = this.tileSprites[r2][c2];
    const posA = this._tileXY(r1, c1);
    const posB = this._tileXY(r2, c2);

    // Slide towards target then bounce back
    this.tweens.add({
      targets: sprA,
      x: posA.x + (posB.x - posA.x) * 0.35,
      y: posA.y + (posB.y - posA.y) * 0.35,
      duration: INVALID_SWAP_DURATION * 0.4,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => { this.busy = false; },
    });
    this.tweens.add({
      targets: sprB,
      x: posB.x + (posA.x - posB.x) * 0.35,
      y: posB.y + (posA.y - posB.y) * 0.35,
      duration: INVALID_SWAP_DURATION * 0.4,
      ease: 'Sine.easeOut',
      yoyo: true,
    });
  }

  /**
   * Find matches → pop them → apply gravity → fill → repeat (cascades).
   * cascadeLevel is used for future score multipliers.
   */
  _processMatches(cascadeLevel) {
    const matches = this.board.findMatches();
    if (matches.length === 0) {
      this.busy = false;
      this._checkEndCondition();
      return;
    }

    // Score: simple 100 per tile for now; multiplied by cascade
    const multiplier = Math.pow(1.5, cascadeLevel) | 0 || 1;
    this.score += matches.length * 100 * multiplier;
    this._updateHUD();

    this._animatePop(matches, () => {
      const falls = this.board.removeMatches(matches);
      const spawns = this.board.fillEmpty();

      // Destroy popped sprites and update grid reference
      for (const { row, col } of matches) {
        if (this.tileSprites[row][col]) {
          this.tileSprites[row][col].destroy();
          this.tileSprites[row][col] = null;
        }
      }

      // Move existing sprites to their new rows (gravity)
      for (const { col, toRow, fromRow } of falls) {
        const spr = this.tileSprites[fromRow][col];
        if (!spr) continue;
        this.tileSprites[toRow][col] = spr;
        this.tileSprites[fromRow][col] = null;
        const { y: targetY } = this._tileXY(toRow, col);
        const dist = Math.abs(targetY - spr.y);
        this.tweens.add({
          targets: spr,
          y: targetY,
          duration: FALL_DURATION_BASE + dist * FALL_DURATION_PER_PX,
          ease: 'Bounce.easeOut',
        });
      }

      // Spawn new tiles above the board and fall into place
      let maxFallDuration = 0;
      for (const { col, row, type } of spawns) {
        const above = this._spawnAboveBoard(col);
        const spr = this.add.image(above.x, above.y, `tile_${type}`)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setData('row', row)
          .setData('col', col)
          .setData('type', type);
        this.tileSprites[row][col] = spr;

        const { y: targetY } = this._tileXY(row, col);
        const dist = Math.abs(targetY - above.y);
        const dur = FALL_DURATION_BASE + dist * FALL_DURATION_PER_PX;
        if (dur > maxFallDuration) maxFallDuration = dur;

        this.tweens.add({
          targets: spr,
          y: targetY,
          duration: dur,
          ease: 'Bounce.easeOut',
        });
      }

      // After all falls settle, check for cascade
      this.time.delayedCall(maxFallDuration + CASCADE_PAUSE, () => {
        this._processMatches(cascadeLevel + 1);
      });
    });
  }

  _animatePop(cells, onComplete) {
    let remaining = cells.length;
    const done = () => { if (--remaining === 0) onComplete(); };

    for (const { row, col } of cells) {
      const spr = this.tileSprites[row][col];
      if (!spr) { done(); continue; }

      this.tweens.add({
        targets: spr,
        scaleX: 1.3, scaleY: 1.3,
        alpha: 0,
        duration: POP_DURATION,
        ease: 'Cubic.easeOut',
        onComplete: done,
      });
    }
  }

  _checkEndCondition() {
    if (this.moves <= 0) {
      this.time.delayedCall(400, () => {
        this.scene.start('MenuScene');
      });
    }
  }
}
