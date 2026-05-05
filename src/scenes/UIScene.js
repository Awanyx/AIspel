import Phaser from 'phaser';

// Stub — HUD lives in GameScene for now.
// This scene is reserved for a parallel HUD overlay once the game expands.
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {}
}
