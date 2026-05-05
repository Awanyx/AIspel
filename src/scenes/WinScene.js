import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { getNextLevel } from '../game/levels.js';
import { recordCompletion } from '../game/Storage.js';

export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  /** Expected init data: { levelId, score } */
  init(data) {
    this.levelId = data.levelId ?? 1;
    this.score   = data.score   ?? 0;
    recordCompletion(this.levelId);
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this._drawBackground();

    this.add.text(cx, 200, '🎉', { fontSize: '72px' }).setOrigin(0.5);

    this.add.text(cx, 300, 'LEVEL COMPLETE!', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#9b59b6',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(cx, 368, 'Score', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    this.add.text(cx, 404, String(this.score), {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hasNext = !!getNextLevel(this.levelId);
    if (hasNext) {
      this._makeButton(cx, 530, 'NEXT LEVEL', 0x27ae60, () => {
        this.scene.start('GameScene', { levelId: this.levelId + 1 });
      });
    }

    this._makeButton(cx, hasNext ? 612 : 530, 'WORLD MAP', 0x555577, () => {
      this.scene.start('MapScene');
    });
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0520, 0x0d0520, 0x1a0a2e, 0x1a0a2e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const color = TILE_COLORS[i % TILE_COLORS.length];
      const dot = this.add.graphics();
      dot.fillStyle(color, Phaser.Math.FloatBetween(0.4, 0.9));
      dot.fillCircle(x, y, Phaser.Math.Between(3, 7));
      this.tweens.add({
        targets: dot, y: y + Phaser.Math.Between(60, 180), alpha: 0,
        duration: Phaser.Math.Between(1800, 3200),
        delay: Phaser.Math.Between(0, 1000),
        repeat: -1, repeatDelay: Phaser.Math.Between(200, 800),
      });
    }
  }

  _makeButton(x, y, label, color, callback) {
    const w = 220; const h = 52;
    const bg = this.add.graphics();
    const draw = (c) => { bg.clear(); bg.fillStyle(c, 1); bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12); };
    draw(color);
    this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(color).lighten(15).color));
    zone.on('pointerout',  () => draw(color));
    zone.on('pointerup',   callback);
  }
}
