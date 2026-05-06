import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';
import { Snd } from '../game/Audio.js';

const CX = GAME_WIDTH / 2;
const LOGO_Y    = 260;   // centre of logo
const PLAY_Y    = 500;   // centre of play button
const MAX_LOGO_W  = 330; // max display width for logo
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

    this.add.text(CX, 260, 'Karaktärskaos', {
      fontSize: '52px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff', stroke: '#9b59b6', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(CX, 320, 'Matcha-Tre Pussel', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5);

    const btnY = 560;
    const btn = this.add.image(CX, btnY, 'menu_play_btn').setInteractive({ useHandCursor: true });
    if (btn.width > MAX_PLAY_W) btn.setDisplaySize(MAX_PLAY_W, btn.height * (MAX_PLAY_W / btn.width));
    btn.on('pointerover',  () => btn.setTint(0xddddff));
    btn.on('pointerout',   () => btn.clearTint());
    btn.on('pointerdown',  () => btn.setScale(btn.scaleX * 0.95, btn.scaleY * 0.95));
    btn.on('pointerup',    () => { btn.setScale(btn.scaleX / 0.95, btn.scaleY / 0.95); this._startGame(); });
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

}
