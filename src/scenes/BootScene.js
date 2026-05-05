import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, TILE_COLORS, TILE_LABELS } from '../game/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this._createLoadingBar();

    // Generate colored rectangle textures for each tile type at runtime.
    // These act as placeholders until real character art is ready.
    for (let i = 0; i < TILE_COLORS.length; i++) {
      this._generateTileTexture(i);
    }
    this._generateParticleTexture();
  }

  _generateTileTexture(index) {
    const key = `tile_${index}`;
    if (this.textures.exists(key)) return;

    const size = TILE_SIZE;
    const color = TILE_COLORS[index];
    const label = TILE_LABELS[index];

    const rt = this.add.renderTexture(0, 0, size, size);

    // Rounded rect background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(2, 2, size - 4, size - 4, 8);
    // Inner highlight
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(4, 4, size - 8, 10, 4);

    rt.draw(bg, 0, 0);
    bg.destroy();

    // Draw letter label centred
    const text = this.add.text(size / 2, size / 2, label, {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#00000066',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);

    rt.draw(text, 0, 0);
    text.destroy();

    rt.saveTexture(key);
    rt.destroy();
  }

  _createLoadingBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 60, 'SVT Arkiv', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const barW = 260;
    const barH = 20;
    const barX = cx - barW / 2;
    const barY = cy;

    const outline = this.add.graphics();
    outline.lineStyle(2, 0xffffff, 0.6);
    outline.strokeRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);

    const fill = this.add.graphics();

    this.load.on('progress', (value) => {
      fill.clear();
      fill.fillStyle(0x9b59b6, 1);
      fill.fillRoundedRect(barX, barY, barW * value, barH, 4);
    });

    this.load.on('complete', () => {
      fill.destroy();
      outline.destroy();
    });
  }

  _generateParticleTexture() {
    if (this.textures.exists('particle')) return;
    const size = 10;
    const rt = this.add.renderTexture(0, 0, size, size);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture('particle');
    rt.destroy();
  }

  create() {
    this.scene.start('MenuScene');
  }
}
