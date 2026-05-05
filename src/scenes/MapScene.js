import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { LEVELS } from '../game/levels.js';
import { isUnlocked, isCompleted } from '../game/Storage.js';

const NODE_RADIUS    = 36;
const MAP_PAD_TOP    = 80;
const MAP_PAD_BOTTOM = 120;
const NODE_SPACING_Y = 160;
const NODE_X         = [220, 130, 260, 100, 195, 240, 120, 210]; // winding x per level index

const OBJ_LABELS = { score: '🎯 Score', blockers: '📦 Blockers', time: '⏱ Time' };

export class MapScene extends Phaser.Scene {
  constructor() { super({ key: 'MapScene' }); }

  create() {
    this._popup = null;
    const totalH = MAP_PAD_TOP + (LEVELS.length - 1) * NODE_SPACING_Y + MAP_PAD_BOTTOM + NODE_RADIUS * 2;
    const scrollH = Math.max(totalH, GAME_HEIGHT);

    this._container = this.add.container(0, 0);
    this._drawBg(scrollH);
    this._drawDecos(scrollH);
    this._drawPath();
    this._drawNodes();
    this._drawFixedUI();
    this._setupScroll(scrollH);
  }

  // ─── Background ───────────────────────────────────────────────────────────

  _drawBg(h) {
    const t = this.textures.get('map_bg');
    if (t && t.source.length > 0 && t.source[0].width > 32) {
      const img = this.add.image(GAME_WIDTH / 2, h / 2, 'map_bg').setDisplaySize(GAME_WIDTH, h);
      this._container.add(img);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0d0520, 0x0d0520, 0x1a1060, 0x1a1060, 1);
      g.fillRect(0, 0, GAME_WIDTH, h);
      this._container.add(g);
    }
  }

  _drawDecos(h) {
    for (let i = 0; i < Math.floor(h / 90); i++) {
      const img = this.add.image(
        Phaser.Math.Between(10, GAME_WIDTH - 10),
        Phaser.Math.Between(0, h),
        `tile_${i % TILE_COLORS.length}`
      ).setAlpha(0.07).setAngle(Phaser.Math.Between(-30, 30)).setScale(Phaser.Math.FloatBetween(0.8, 1.6));
      this._container.add(img);
    }
    const title = this.add.text(GAME_WIDTH / 2, 30, 'VÄLJ NIVÅ', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaacc', letterSpacing: 4,
    }).setOrigin(0.5);
    this._container.add(title);
  }

  // ─── Path ─────────────────────────────────────────────────────────────────

  _nodePositions() {
    return LEVELS.map((_, i) => ({
      x: NODE_X[i % NODE_X.length],
      y: MAP_PAD_TOP + i * NODE_SPACING_Y + NODE_RADIUS,
    }));
  }

  _drawPath() {
    const g = this.add.graphics();
    const positions = this._nodePositions();
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i], b = positions[i + 1];
      const unlocked = isUnlocked(LEVELS[i + 1].id);
      g.lineStyle(5, unlocked ? 0x7c3aed : 0x333355, 0.5);
      g.beginPath(); g.moveTo(a.x, a.y + NODE_RADIUS); g.lineTo(b.x, b.y - NODE_RADIUS); g.strokePath();
      for (let s = 1; s < 4; s++) {
        const t = s / 4;
        g.fillStyle(unlocked ? 0x9b59b6 : 0x333366, 0.5);
        g.fillCircle(a.x + (b.x - a.x) * t, (a.y + NODE_RADIUS) + ((b.y - NODE_RADIUS) - (a.y + NODE_RADIUS)) * t, 3);
      }
    }
    this._container.add(g);
  }

  // ─── Nodes ────────────────────────────────────────────────────────────────

  _drawNodes() {
    const positions = this._nodePositions();
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      const level = LEVELS[i];
      const { x, y } = positions[i];
      const unlocked  = isUnlocked(level.id);
      const completed = isCompleted(level.id);
      this._drawNode(level, x, y, unlocked, completed);
    }
  }

  _drawNode(level, x, y, unlocked, completed) {
    const r = NODE_RADIUS;
    const g = this.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.3); g.fillCircle(x + 3, y + 4, r);

    // Fill
    const fill = !unlocked ? 0x2a2a44 : completed ? 0x27ae60 : 0x7c3aed;
    g.fillStyle(fill, 1); g.fillCircle(x, y, r);

    // Stroke
    g.lineStyle(3, unlocked ? 0x9b59b6 : 0x333355, 0.8); g.strokeCircle(x, y, r);

    // Highlight arc
    if (unlocked) {
      g.lineStyle(2, 0xffffff, 0.2);
      g.beginPath(); g.arc(x, y, r - 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false); g.strokePath();
    }
    this._container.add(g);

    // Label or lock
    const label = !unlocked ? '🔒' : completed ? '✓' : String(level.id);
    this._container.add(this.add.text(x, y, label, {
      fontSize: unlocked ? '22px' : '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: unlocked ? '#ffffff' : '#444466',
    }).setOrigin(0.5));

    // Level name
    this._container.add(this.add.text(x, y + r + 14, level.label, {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: unlocked ? '#aaaacc' : '#333355',
    }).setOrigin(0.5));

    // Tap zone
    if (unlocked) {
      const zone = this.add.zone(x, y, r * 2.2, r * 2.2).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this._showPopup(level, x, y));
      this._container.add(zone);
    }
  }

  // ─── Popup ────────────────────────────────────────────────────────────────

  _showPopup(level, nodeX, nodeY) {
    this._closePopup();
    const cx = GAME_WIDTH / 2;
    const scrollY = -this._container.y;
    const popupY = Math.min(nodeY + NODE_RADIUS + 12 - scrollY, GAME_HEIGHT - 190);

    const popup = this.add.container(0, 0).setDepth(10);

    const panelW = 250, panelH = 150;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 0.97);
    panel.fillRoundedRect(cx - panelW / 2, popupY, panelW, panelH, 14);
    panel.lineStyle(2, 0x9b59b6, 0.8);
    panel.strokeRoundedRect(cx - panelW / 2, popupY, panelW, panelH, 14);
    popup.add(panel);

    popup.add(this.add.text(cx, popupY + 22, level.label.toUpperCase(), {
      fontSize: '16px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5));

    const obj = level.objective;
    const objLine = obj.type === 'score'    ? `${OBJ_LABELS.score} ${obj.target}  •  ${obj.moves} moves`
                  : obj.type === 'blockers' ? `${OBJ_LABELS.blockers}  •  ${obj.moves} moves`
                  :                           `${OBJ_LABELS.time} ${obj.seconds}s  •  Target ${obj.target}`;
    popup.add(this.add.text(cx, popupY + 48, objLine, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5));

    const completed = isCompleted(level.id);
    if (completed) {
      popup.add(this.add.text(cx, popupY + 72, '✓  Completed', {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#27ae60',
      }).setOrigin(0.5));
    }

    // Play button
    const btnY = popupY + 112;
    const btnBg = this.add.graphics();
    const drawBtn = (c) => { btnBg.clear(); btnBg.fillStyle(c, 1); btnBg.fillRoundedRect(cx - 60, btnY - 18, 120, 36, 10); };
    drawBtn(0x7c3aed);
    popup.add(btnBg);
    popup.add(this.add.text(cx, btnY, 'SPELA', {
      fontSize: '16px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5));
    const zone = this.add.zone(cx, btnY, 120, 36).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => drawBtn(0x9b59b6));
    zone.on('pointerout',  () => drawBtn(0x7c3aed));
    zone.on('pointerup',   () => this.scene.start('GameScene', { levelId: level.id }));
    popup.add(zone);

    const blocker = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive().setDepth(9);
    blocker.on('pointerup', () => this._closePopup());
    this._popup = { container: popup, blocker };
    this.add.existing(popup); this.add.existing(blocker);
    popup.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: popup, alpha: 1, scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.easeOut' });
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.container.destroy(); this._popup.blocker.destroy(); this._popup = null;
  }

  // ─── Scroll ───────────────────────────────────────────────────────────────

  _setupScroll(contentH) {
    const maxScroll = -(contentH - GAME_HEIGHT);
    let startY = 0, startCY = 0, lastY = 0, vel = 0, dragging = false;
    this.input.on('pointerdown',  (p) => { startY = p.y; startCY = this._container.y; lastY = p.y; vel = 0; dragging = true; });
    this.input.on('pointermove',  (p) => { if (!dragging || !p.isDown) return; vel = p.y - lastY; lastY = p.y; if (Math.abs(p.y - startY) > 8) this._container.y = Phaser.Math.Clamp(startCY + (p.y - startY), maxScroll, 0); });
    this.input.on('pointerup',    ()  => { dragging = false; });
    this.events.on('update', () => { if (!dragging && Math.abs(vel) > 0.5) { this._container.y = Phaser.Math.Clamp(this._container.y + vel, maxScroll, 0); vel *= 0.88; } });
  }

  // ─── Fixed UI ─────────────────────────────────────────────────────────────

  _drawFixedUI() {
    const fade = this.add.graphics().setDepth(5);
    fade.fillGradientStyle(0x0d0520, 0x0d0520, 0x0d0520, 0x0d0520, 1, 1, 0, 0);
    fade.fillRect(0, 0, GAME_WIDTH, 68);

    this.add.text(GAME_WIDTH / 2, 22, 'SVT ARKIV', {
      fontSize: '18px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5).setDepth(6);

    this.add.text(24, 22, '←', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0, 0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { this._closePopup(); this.scene.start('MenuScene'); });
  }
}
