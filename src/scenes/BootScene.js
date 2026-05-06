import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, TILE_COLORS, TILE_LABELS } from '../game/constants.js';

// Character per tile index — must match TILE_COLORS order in constants.js
const TILE_NAMES = [
  'bolibompa',     // 0 — Bolibompadraken
  'sommarskuggan', // 1 — black cat creature
  'ratatoskr',     // 2
  'pippi',         // 3
  'zombie',        // 4
  'laszlo',        // 5 — scary person
  'snigel',        // 6 — Snigel
  'gamingtrollet', // 7 — Gamingtrollet
  'vinterskuggan', // 8 — Vinterskuggan
  'tussen',        // 9 — Tussen
  'chefen',        // 10 — Chefen
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this._createLoadingBar();

    // Load PNG tile assets by character name; fall back to generated textures
    // for any that fail to load.
    for (let i = 0; i < TILE_NAMES.length; i++) {
      const key = `tile_${i}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, `assets/tiles/tile_${TILE_NAMES[i]}.png`);
      }
    }

    // Special activation sprite sheets — 8 frames × 400×400px horizontal strip.
    // Silently skipped if the file is not yet in public/assets/animations/.
    for (const type of ['bolibompa', 'pippi', 'ratatoskr', 'sommarskuggan']) {
      this.load.spritesheet(`anim_${type}`, `assets/animations/anim_${type}.png`, {
        frameWidth: 400, frameHeight: 400,
      });
    }

    // Blocker tile and special frame overlays
    this.load.image('tile_blocker', 'assets/tiles/tile_blocker.png');
    for (const type of ['bolibompa', 'pippi', 'ratatoskr', 'sommarskuggan']) {
      this.load.image(`special_${type}`, `assets/tiles/special_${type}.png`);
    }

    // Level backgrounds — silently skipped if not yet present.
    for (let i = 1; i <= 8; i++) {
      this.load.image(`level_bg_${i}`, `assets/ui/level_bg_${i}.png`);
    }

    // Win / fail reaction art — silently skipped if not yet present.
    this.load.image('reaction_win',  'assets/ui/reaction_win.png');
    this.load.image('reaction_fail', 'assets/ui/reaction_fail.png');

    // World map background — silently skipped if not yet present.
    this.load.image('map_bg', 'assets/ui/map_bg.png');

    // Custom menu assets — silently skipped if not yet present.
    this.load.image('menu_bg',       'assets/ui/menu_bg.png');
    this.load.image('menu_logo',     'assets/ui/menu_logo.png');
    this.load.image('menu_play_btn', 'assets/ui/menu_play_btn.png');

    // If an image/sheet fails to load, generate a coloured placeholder for tiles.
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

    // Show the logo as soon as it finishes loading; nothing shown above the bar
    // until then (avoids showing text that the logo will replace).
    this.load.once('filecomplete-image-menu_logo', () => {
      this.add.image(cx, cy - 80, 'menu_logo')
        .setDisplaySize(300, 120)
        .setOrigin(0.5);
    });

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
