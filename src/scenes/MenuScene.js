import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { Snd } from '../game/Audio.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Background gradient via graphics
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b5e, 0x2d1b5e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative tiles scattered in background
    this._scatterDecoTiles();

    // Title
    this.add.text(cx, 260, 'SVT', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#9b59b6',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, 340, 'ARKIV', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#e8b4f0',
    }).setOrigin(0.5);

    this.add.text(cx, 410, 'Match-Three Puzzle', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Play button
    const btnY = 560;
    const btn = this.add.graphics();
    btn.fillStyle(0x9b59b6, 1);
    btn.fillRoundedRect(cx - 110, btnY - 28, 220, 56, 14);

    const btnText = this.add.text(cx, btnY, 'PLAY', {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btnZone = this.add.zone(cx, btnY, 220, 56).setInteractive({ useHandCursor: true });
    btnZone.on('pointerover', () => { btn.clear(); btn.fillStyle(0xb07cc8, 1); btn.fillRoundedRect(cx - 110, btnY - 28, 220, 56, 14); });
    btnZone.on('pointerout',  () => { btn.clear(); btn.fillStyle(0x9b59b6, 1); btn.fillRoundedRect(cx - 110, btnY - 28, 220, 56, 14); });
    btnZone.on('pointerup',   () => {
      Snd.resume();
      Snd.startMusic();
      this.scene.start('MapScene');
    });

    // Mute toggle
    const muteBtn = this.add.text(GAME_WIDTH - 24, 28, Snd.muted ? '🔇' : '🔊', {
      fontSize: '22px',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => { Snd.resume(); });
    muteBtn.on('pointerup', () => {
      Snd.toggle();
      muteBtn.setText(Snd.muted ? '🔇' : '🔊');
    });
  }

  _scatterDecoTiles() {
    const positions = [
      [40,  120], [340, 90],  [60,  700], [330, 750],
      [20,  400], [360, 420], [100, 180], [280, 160],
    ];
    positions.forEach(([x, y], i) => {
      const type = i % TILE_COLORS.length;
      this.add.image(x, y, `tile_${type}`)
        .setAlpha(0.18)
        .setAngle(Phaser.Math.Between(-20, 20))
        .setScale(1.4);
    });
  }
}
