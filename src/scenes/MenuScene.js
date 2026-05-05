import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { Snd } from '../game/Audio.js';

const CX = GAME_WIDTH / 2;
const LOGO_Y    = 310;   // centre of logo
const PLAY_Y    = 600;   // centre of play button
const MAX_LOGO_W  = 340; // max display width for logo
const MAX_PLAY_W  = 260; // max display width for play button

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    this._hasAsset('menu_bg') ? this._buildCustomMenu() : this._buildFallbackMenu();
    this._addMuteButton();
  }

  // ─── Custom asset menu ───────────────────────────────────────────────────

  _buildCustomMenu() {
    // Full-screen background
    this.add.image(CX, GAME_HEIGHT / 2, 'menu_bg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Logo — scale down to fit MAX_LOGO_W if larger, otherwise natural size
    if (this._hasAsset('menu_logo')) {
      const logo = this.add.image(CX, LOGO_Y, 'menu_logo');
      if (logo.width > MAX_LOGO_W) logo.setDisplaySize(MAX_LOGO_W, logo.height * (MAX_LOGO_W / logo.width));
    }

    // Play button — interactive PNG
    if (this._hasAsset('menu_play_btn')) {
      const btn = this.add.image(CX, PLAY_Y, 'menu_play_btn').setInteractive({ useHandCursor: true });
      if (btn.width > MAX_PLAY_W) btn.setDisplaySize(MAX_PLAY_W, btn.height * (MAX_PLAY_W / btn.width));
      btn.on('pointerover',  () => btn.setTint(0xddddff));
      btn.on('pointerout',   () => btn.clearTint());
      btn.on('pointerdown',  () => btn.setScale(btn.scaleX * 0.95, btn.scaleY * 0.95));
      btn.on('pointerup',    () => { btn.setScale(btn.scaleX / 0.95, btn.scaleY / 0.95); this._startGame(); });
    }
  }

  // ─── Fallback (no custom assets) ─────────────────────────────────────────

  _buildFallbackMenu() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b5e, 0x2d1b5e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this._scatterDecoTiles();

    this.add.text(CX, 260, 'SVT', {
      fontSize: '72px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff', stroke: '#9b59b6', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(CX, 340, 'ARKIV', {
      fontSize: '48px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#e8b4f0',
    }).setOrigin(0.5);

    this.add.text(CX, 410, 'Match-Three Puzzle', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    const btnY = 560;
    const btn = this.add.graphics();
    const drawBtn = (c) => { btn.clear(); btn.fillStyle(c, 1); btn.fillRoundedRect(CX - 110, btnY - 28, 220, 56, 14); };
    drawBtn(0x9b59b6);
    this.add.text(CX, btnY, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add.zone(CX, btnY, 220, 56).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => drawBtn(0xb07cc8));
    zone.on('pointerout',  () => drawBtn(0x9b59b6));
    zone.on('pointerup',   () => this._startGame());
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  _startGame() {
    Snd.resume();
    Snd.startMusic();
    this.scene.start('MapScene');
  }

  _addMuteButton() {
    const btn = this.add.text(GAME_WIDTH - 24, 28, Snd.muted ? '🔇' : '🔊', {
      fontSize: '22px',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => Snd.resume());
    btn.on('pointerup',   () => { Snd.toggle(); btn.setText(Snd.muted ? '🔇' : '🔊'); });
  }

  /** Returns true if the texture loaded as a real image (not the 32×32 missing placeholder). */
  _hasAsset(key) {
    const t = this.textures.get(key);
    return t && t.source.length > 0 && t.source[0].width > 32;
  }

  _scatterDecoTiles() {
    const positions = [
      [40, 120], [340, 90],  [60, 700], [330, 750],
      [20, 400], [360, 420], [100, 180], [280, 160],
    ];
    positions.forEach(([x, y], i) => {
      this.add.image(x, y, `tile_${i % TILE_COLORS.length}`)
        .setAlpha(0.18).setAngle(Phaser.Math.Between(-20, 20)).setScale(1.4);
    });
  }
}
