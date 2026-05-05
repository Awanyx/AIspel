import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';
import { Snd } from '../game/Audio.js';

export class FailScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FailScene' });
  }

  /** Expected init data: { levelId, score, reason } */
  init(data) {
    this.levelId = data.levelId ?? 1;
    this.score   = data.score   ?? 0;
    this.reason  = data.reason  ?? 'Out of moves!';
  }

  create() {
    const cx = GAME_WIDTH / 2;

    Snd.fail();
    this._drawBackground();

    // Sad face emoji stand-in (placeholder for character reaction art)
    this.add.text(cx, 200, '😔', {
      fontSize: '72px',
    }).setOrigin(0.5);

    // Wobble the emoji sympathetically
    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      angle: { from: -8, to: 8 },
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.add.text(cx, 300, 'SO CLOSE!', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#e8b4f0',
      stroke: '#9b59b6',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 348, this.reason, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Score
    this.add.text(cx, 410, 'Score', {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', color: '#888899',
    }).setOrigin(0.5);

    this.add.text(cx, 440, String(this.score), {
      fontSize: '42px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Buttons
    this._makeButton(cx, 540, 'TRY AGAIN', 0x9b59b6, () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });

    this._makeButton(cx, 612, 'WORLD MAP', 0x555577, () => {
      this.scene.start('MapScene');
    });
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0520, 0x0d0520, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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
