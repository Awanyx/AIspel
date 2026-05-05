export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const COLS = 8;
export const ROWS = 8;

// Tile size derived from available board width with some padding
export const TILE_SIZE = 44;
export const TILE_GAP = 2;
export const TILE_STEP = TILE_SIZE + TILE_GAP;

// Board origin — centered horizontally, with HUD space above
export const BOARD_ORIGIN_X = (GAME_WIDTH - COLS * TILE_STEP + TILE_GAP) / 2;
export const BOARD_ORIGIN_Y = 160;

export const SWIPE_THRESHOLD = 20; // px

// Tile type indices 0–5
export const TILE_TYPES = 6;

export const TILE_COLORS = [
  0x9b59b6, // 0 Bolibompadraken — purple
  0x1a1a2e, // 1 Sommarskuggan   — near-black (black cat)
  0xd4652a, // 2 Ratatoskr        — warm orange
  0xe74c3c, // 3 Pippi            — red
  0x27ae60, // 4 Zombie           — green
  0x2a9d8f, // 5 Laszlo           — teal (scary person)
];

export const TILE_LABELS = ['B', 'S', 'R', 'P', 'Z', 'L'];

// Durations (ms)
export const SWAP_DURATION = 120;
export const INVALID_SWAP_DURATION = 150;
export const FALL_DURATION_BASE = 80;
export const FALL_DURATION_PER_PX = 0.5;
export const POP_DURATION = 150;
export const CASCADE_PAUSE = 200;
