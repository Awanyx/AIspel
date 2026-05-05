import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, TILE_COLORS, TILE_LABELS } from '../game/constants.js';

// Character names in tile-index order (matches TILE_COLORS)
// Character per tile index — must match TILE_COLORS order in constants.js
const TILE_NAMES = [
  'bolibompadraken', // 0
  'sommarskuggan',   // 1 — black cat creature
  'ratatoskr',       // 2
  'pippi',           // 3
  'zombie',          // 4
  'laszlo',          // 5 — scary person
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this._createLoadingBar();

    // Attempt to load PNG tile assets; fall back to generated textures for
    // any that fail (e.g. file not yet dropped into public/assets/tiles/).
    for (let i = 0; i < TILE_COLORS.length; i++) {
      const key = `tile_${i}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, `assets/tiles/tile_${i}.png`);
      }
    }

    // If an image fails to load, generate a coloured placeholder instead.
    this.load.on('loaderror', (file) => {
      const match = file.key.match(/^tile_(\d+)$/);
      if (match) this._generateTileTexture(Number(match[1]));
    });

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
