import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_COLORS } from '../game/constants.js';
import { LEVELS } from '../game/levels.js';
import { getStars, isUnlocked } from '../game/Storage.js';

// Layout constants
const NODE_RADIUS = 36;
const MAP_PADDING_TOP = 80;
const MAP_PADDING_BOTTOM = 120;
const NODE_SPACING_Y = 160;

// Winding x-positions for each node (alternates left-center-right)
const NODE_X_POSITIONS = [220, 130, 260, 100, 195];

const COLOR_LOCKED    = 0x333355;
const COLOR_UNLOCKED  = 0x7c3aed;
const COLOR_COMPLETE  = 0x27ae60;
const COLOR_STROKE    = 0x9b59b6;
const STAR_GOLD       = 0xffd700;
const STAR_EMPTY      = 0x444466;

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  create() {
    this._popup = null;

    // Total scrollable height
    const totalH = MAP_PADDING_TOP + (LEVELS.length - 1) * NODE_SPACING_Y + MAP_PADDING_BOTTOM + NODE_RADIUS * 2;
    const scrollH = Math.max(totalH, GAME_HEIGHT);

    // Scrollable container
    this._container = this.add.container(0, 0);

    this._drawMapBackground(scrollH);
    this._drawDecorations(scrollH);
    this._drawPath();
    this._drawNodes();
    this._drawFixedUI();
    this._setupScroll(scrollH);
  }

  // ─── Background ────────────────────────────────────────────────────────────

  _drawMapBackground(h) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0520, 0x0d0520, 0x1a1060, 0x1a1060, 1);
    bg.fillRect(0, 0, GAME_WIDTH, h);
    this._container.add(bg);
  }

  _drawDecorations(h) {
    // Scattered faint tile icons as archive "items"
    const count = Math.floor(h / 100);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(10, GAME_WIDTH - 10);
      const y = Phaser.Math.Between(0, h);
      const type = i % TILE_COLORS.length;
      const img = this.add.image(x, y, `tile_${type}`)
        .setAlpha(0.07)
        .setAngle(Phaser.Math.Between(-30, 30))
        .setScale(Phaser.Math.FloatBetween(0.8, 1.6));
      this._container.add(img);
    }

    // Section label
    const title = this.add.text(GAME_WIDTH / 2, 30, 'VÄLJ NIVÅ', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
      letterSpacing: 4,
    }).setOrigin(0.5);
    this._container.add(title);
  }

  // ─── Path ──────────────────────────────────────────────────────────────────

  _drawPath() {
    const g = this.add.graphics();
    const nodePositions = this._getNodePositions();

    for (let i = 0; i < nodePositions.length - 1; i++) {
      const a = nodePositions[i];
      const b = nodePositions[i + 1];
      const unlocked = isUnlocked(LEVELS[i + 1].id);

      g.lineStyle(6, unlocked ? 0x7c3aed : 0x333355, 0.6);

      // Curved path via quadratic bezier
      const mx = (a.x + b.x) / 2 + (i % 2 === 0 ? 30 : -30);
      const my = (a.y + b.y) / 2;

      g.beginPath();
      g.moveTo(a.x, a.y + NODE_RADIUS);
      g.lineTo(b.x, b.y - NODE_RADIUS);
      g.strokePath();

      // Dashed dots along the path for flair
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const dx = a.x + (b.x - a.x) * t;
        const dy = (a.y + NODE_RADIUS) + ((b.y - NODE_RADIUS) - (a.y + NODE_RADIUS)) * t;
        g.fillStyle(unlocked ? 0x9b59b6 : 0x444466, 0.5);
        g.fillCircle(dx, dy, 3);
      }
    }

    this._container.add(g);
  }

  // ─── Nodes ─────────────────────────────────────────────────────────────────

  _getNodePositions() {
    return LEVELS.map((_, i) => ({
      x: NODE_X_POSITIONS[i % NODE_X_POSITIONS.length],
      y: MAP_PADDING_TOP + i * NODE_SPACING_Y + NODE_RADIUS,
    }));
  }

  _drawNodes() {
    const positions = this._getNodePositions();

    // Draw in reverse so level 1 appears visually on top when overlapping
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      const level = LEVELS[i];
      const { x, y } = positions[i];
      const unlocked = isUnlocked(level.id);
      const stars = getStars(level.id);
      const completed = stars > 0;

      this._drawNode(level, x, y, unlocked, completed, stars);
    }
  }

  _drawNode(level, x, y, unlocked, completed, stars) {
    const r = NODE_RADIUS;
    const g = this.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(x + 3, y + 4, r);

    // Fill
    const fillColor = !unlocked ? COLOR_LOCKED : completed ? COLOR_COMPLETE : COLOR_UNLOCKED;
    g.fillStyle(fillColor, 1);
    g.fillCircle(x, y, r);

    // Stroke ring
    g.lineStyle(3, unlocked ? COLOR_STROKE : 0x222244, 0.8);
    g.strokeCircle(x, y, r);

    // Inner highlight arc
    if (unlocked) {
      g.lineStyle(2, 0xffffff, 0.2);
      g.beginPath();
      g.arc(x, y, r - 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();
    }

    this._container.add(g);

    // Level number or lock icon
    const label = unlocked ? String(level.id) : '🔒';
    const numText = this.add.text(x, y - (stars > 0 ? 8 : 0), label, {
      fontSize: unlocked ? '22px' : '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: unlocked ? '#ffffff' : '#555577',
    }).setOrigin(0.5);
    this._container.add(numText);

    // Stars row below number
    if (unlocked) {
      this._drawNodeStars(x, y + 14, stars);
    }

    // Tap target — only on unlocked nodes
    if (unlocked) {
      const zone = this.add.zone(x, y, r * 2.2, r * 2.2).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this._showPopup(level, x, y, stars));
      this._container.add(zone);
    }

    // Level name label beneath node
    const nameText = this.add.text(x, y + r + 14, level.label, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: unlocked ? '#aaaacc' : '#333355',
    }).setOrigin(0.5);
    this._container.add(nameText);
  }

  _drawNodeStars(x, y, filled) {
    const spacing = 14;
    const startX = x - spacing;
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * spacing;
      const g = this.add.graphics();
      this._drawMiniStar(g, sx, y, 5, i < filled ? STAR_GOLD : STAR_EMPTY);
      this._container.add(g);
    }
  }

  _drawMiniStar(g, x, y, radius, color) {
    g.fillStyle(color, 1);
    const points = [];
    const outerR = radius;
    const innerR = radius * 0.42;
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }
    g.fillPoints(points, true);
  }

  // ─── Popup ─────────────────────────────────────────────────────────────────

  _showPopup(level, nodeX, nodeY, stars) {
    this._closePopup();

    const cx = GAME_WIDTH / 2;
    // Place popup below node, but keep inside visible area
    const scrollY = -this._container.y;
    const popupY = Math.min(
      nodeY + NODE_RADIUS + 12 - scrollY,
      GAME_HEIGHT - 180
    );

    const popup = this.add.container(0, 0);
    popup.setDepth(10);

    // Panel
    const panelW = 240;
    const panelH = 140;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 0.97);
    panel.fillRoundedRect(cx - panelW / 2, popupY, panelW, panelH, 14);
    panel.lineStyle(2, 0x9b59b6, 0.8);
    panel.strokeRoundedRect(cx - panelW / 2, popupY, panelW, panelH, 14);
    popup.add(panel);

    // Title
    popup.add(this.add.text(cx, popupY + 22, level.label.toUpperCase(), {
      fontSize: '16px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5));

    // Objective description
    const objLabel = `Score target: ${level.objective.target}  •  ${level.objective.moves} moves`;
    popup.add(this.add.text(cx, popupY + 46, objLabel, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0.5));

    // Stars earned so far
    const starRow = this.add.container(cx - 21, popupY + 64);
    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics();
      this._drawMiniStar(g, i * 22, 0, 7, i < stars ? STAR_GOLD : STAR_EMPTY);
      starRow.add(g);
    }
    popup.add(starRow);

    // Play button
    const btnY = popupY + 100;
    const btnW = 120;
    const btnH = 36;
    const btnBg = this.add.graphics();
    const drawBtn = (c) => {
      btnBg.clear();
      btnBg.fillStyle(c, 1);
      btnBg.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    };
    drawBtn(0x7c3aed);
    popup.add(btnBg);
    popup.add(this.add.text(cx, btnY, 'SPELA', {
      fontSize: '16px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5));

    const playZone = this.add.zone(cx, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    playZone.on('pointerover', () => drawBtn(0x9b59b6));
    playZone.on('pointerout',  () => drawBtn(0x7c3aed));
    playZone.on('pointerup',   () => this.scene.start('GameScene', { levelId: level.id }));
    popup.add(playZone);

    // Close on tap outside
    const blocker = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(9);
    blocker.on('pointerup', () => this._closePopup());

    this._popup = { container: popup, blocker };
    this.add.existing(popup);
    this.add.existing(blocker);

    // Pop-in tween
    popup.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: popup, alpha: 1, scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.easeOut' });
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.container.destroy();
    this._popup.blocker.destroy();
    this._popup = null;
  }

  // ─── Scroll ────────────────────────────────────────────────────────────────

  _setupScroll(contentH) {
    const maxScroll = -(contentH - GAME_HEIGHT);
    let startY = 0;
    let startContainerY = 0;
    let isDragging = false;
    let lastY = 0;
    let velocity = 0;

    this.input.on('pointerdown', (p) => {
      startY = p.y;
      startContainerY = this._container.y;
      lastY = p.y;
      velocity = 0;
      isDragging = true;
    });

    this.input.on('pointermove', (p) => {
      if (!isDragging || !p.isDown) return;
      velocity = p.y - lastY;
      lastY = p.y;
      const dy = p.y - startY;
      // Only scroll if clearly vertical (suppress horizontal node-tap conflicts)
      if (Math.abs(dy) > 8) {
        this._container.y = Phaser.Math.Clamp(startContainerY + dy, maxScroll, 0);
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Momentum
    this.events.on('update', () => {
      if (!isDragging && Math.abs(velocity) > 0.5) {
        this._container.y = Phaser.Math.Clamp(this._container.y + velocity, maxScroll, 0);
        velocity *= 0.88;
      }
    });
  }

  // ─── Fixed UI (top bar always visible) ─────────────────────────────────────

  _drawFixedUI() {
    // Gradient fade at top so nodes scroll behind a clean header
    const topFade = this.add.graphics().setDepth(5);
    topFade.fillGradientStyle(0x0d0520, 0x0d0520, 0x0d0520, 0x0d0520, 1, 1, 0, 0);
    topFade.fillRect(0, 0, GAME_WIDTH, 68);

    // Title bar
    this.add.text(GAME_WIDTH / 2, 22, 'SVT ARKIV', {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(6);

    // Back to menu
    this.add.text(24, 22, '←', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
    }).setOrigin(0, 0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this._closePopup();
        this.scene.start('MenuScene');
      });
  }
}
