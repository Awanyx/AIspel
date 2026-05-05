import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { WinScene } from './scenes/WinScene.js';
import { FailScene } from './scenes/FailScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    min: { width: 320, height: 568 },
    max: { width: 430, height: 932 },
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, WinScene, FailScene],
};

const game = new Phaser.Game(config);

// Prevent default touch behavior (scroll / zoom) on the canvas
game.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
game.canvas.addEventListener('touchmove',  (e) => e.preventDefault(), { passive: false });
game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
