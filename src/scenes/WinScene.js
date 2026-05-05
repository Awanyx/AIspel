import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { getNextLevel } from '../game/levels.js';
import { recordCompletion } from '../game/Storage.js';

const STAR_COLOR_EMPTY = 0x444466;
const STAR_COLOR_FILL  = 0xffd700;
const STAR_STROKE      = 0xffa500;

export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  /** Expected init data: { levelId, score, stars } */
  init(data) {
    this.levelId = data.levelId ?? 1;
    this.score   = data.score   ?? 0;
    this.stars   = data.stars   ?? 0;
    // Persist immediately so MapScene reflects latest progress on return
    recordCompletion(this.levelId, this.stars);
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this._drawBackground();

    // Title
    this.add.text(cx, 180, 'LEVEL COMPLETE!', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#9b59b6',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Score
    this.add.text(cx, 248, 'Score', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    this.add.text(cx, 278, String(this.score), {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Stars — reveal one by one
    this._buildStars(cx, 370);

    // Buttons
    const hasNext = !!getNextLevel(this.levelId);
    if (hasNext) {
      this._makeButton(cx, 520, 'NEXT LEVEL', 0x27ae60, () => {
        this.scene.start('GameScene', { levelId: this.levelId + 1 });
      });
    }

    this._makeButton(cx, hasNext ? 600 : 540, 'WORLD MAP', 0x555577, () => {
      this.scene.start('MapScene');
    });
  }

  _drawBackground() {
    // Semi-transparent dark panel over whatever was behind
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0520, 0x0d0520, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Confetti dots
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const color = TILE_COLORS[i % TILE_COLORS.length];
      const dot = this.add.graphics();
      dot.fillStyle(color, Phaser.Math.FloatBetween(0.4, 0.9));
      dot.fillCircle(x, y, Phaser.Math.Between(3, 7));

      this.tweens.add({
        targets: dot,
        y: y + Phaser.Math.Between(60, 180),
        alpha: 0,
        duration: Phaser.Math.Between(1800, 3200),
        delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(200, 800),
      });
    }
  }

  _buildStars(cx, y) {
    const starSpacing = 90;
    const startX = cx - starSpacing;

    for (let i = 0; i < 3; i++) {
      const sx = startX + i * starSpacing;
      const filled = i < this.stars;
      const g = this._drawStar(sx, y, 32, filled ? STAR_COLOR_FILL : STAR_COLOR_EMPTY);
      g.setAlpha(0);
      g.setScale(0.2);

      this.tweens.add({
        targets: g,
        alpha: 1,
        scaleX: filled ? 1.2 : 0.9,
        scaleY: filled ? 1.2 : 0.9,
        duration: 320,
        ease: 'Back.easeOut',
        delay: 300 + i * 250,
        onComplete: () => {
          if (filled) {
            // Settle back to normal size with a shine pulse
            this.tweens.add({
              targets: g,
              scaleX: 1, scaleY: 1,
              duration: 180,
              ease: 'Sine.easeOut',
            });
            this._starShine(sx, y);
          }
        },
      });
    }
  }

  _drawStar(x, y, radius, fillColor) {
    const g = this.add.graphics();
    g.fillStyle(fillColor, 1);
    g.lineStyle(2, STAR_STROKE, fillColor === STAR_COLOR_FILL ? 1 : 0.3);

    const points = [];
    const outerR = radius;
    const innerR = radius * 0.42;
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }

    g.fillPoints(points, true);
    g.strokePoints(points, true);
    return g;
  }

  _starShine(x, y) {
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.8);
    shine.fillCircle(x, y, 8);
    this.tweens.add({
      targets: shine,
      scaleX: 4, scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => shine.destroy(),
    });
  }

  _makeButton(x, y, label, color, callback) {
    const w = 220;
    const h = 52;
    const bg = this.add.graphics();
    const draw = (c) => {
      bg.clear();
      bg.fillStyle(c, 1);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    };
    draw(color);

    this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => draw(Phaser.Display.Color.IntegerToColor(color).lighten(15).color));
    zone.on('pointerout',   () => draw(color));
    zone.on('pointerup',    callback);
  }
}
