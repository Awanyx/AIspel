import { COLS, ROWS, TILE_TYPES } from './constants.js';

/**
 * Pure data model for the 8×8 grid.
 * grid[row][col] = tile type (0–5), or null for empty.
 */
export class Board {
  constructor() {
    this.grid = [];
    this.init();
  }

  init() {
    do {
      this.grid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => this._randomType())
      );
    } while (this.findMatches().length > 0);
  }

  _randomType() {
    return Math.floor(Math.random() * TILE_TYPES);
  }

  get(row, col) {
    return this.grid[row]?.[col] ?? null;
  }

  set(row, col, type) {
    this.grid[row][col] = type;
  }

  swap(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  }

  /**
   * Returns an array of match groups, each group being an array of {row, col}.
   * Horizontal and vertical matches of length >= 3.
   */
  findMatches() {
    const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      let run = 1;
      for (let c = 1; c <= COLS; c++) {
        const same = c < COLS && this.grid[r][c] !== null &&
          this.grid[r][c] === this.grid[r][c - 1];
        if (same) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = c - run; k < c; k++) matched[r][k] = true;
          }
          run = 1;
        }
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      let run = 1;
      for (let r = 1; r <= ROWS; r++) {
        const same = r < ROWS && this.grid[r][c] !== null &&
          this.grid[r][c] === this.grid[r - 1][c];
        if (same) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = r - run; k < r; k++) matched[k][c] = true;
          }
          run = 1;
        }
      }
    }

    const cells = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (matched[r][c]) cells.push({ row: r, col: c });

    return cells;
  }

  /**
   * Remove matched cells (set to null) and apply gravity.
   * Returns a description of which cells fell: [{row, col, fromRow}].
   */
  removeMatches(cells) {
    for (const { row, col } of cells) this.grid[row][col] = null;
    return this.applyGravity();
  }

  /**
   * Shift non-null tiles downward within each column to fill nulls.
   * Returns array of {col, toRow, fromRow, type} for animation.
   */
  applyGravity() {
    const falls = [];
    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (r !== writeRow) {
            falls.push({ col: c, toRow: writeRow, fromRow: r, type: this.grid[r][c] });
            this.grid[writeRow][c] = this.grid[r][c];
            this.grid[r][c] = null;
          }
          writeRow--;
        }
      }
    }
    return falls;
  }

  /**
   * Fill empty cells at the top with new random tiles.
   * Returns [{col, row, type}] for animation.
   */
  fillEmpty() {
    const spawns = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === null) {
          const type = this._randomType();
          this.grid[r][c] = type;
          spawns.push({ col: c, row: r, type });
        }
      }
    }
    return spawns;
  }

  wouldMatch(r1, c1, r2, c2) {
    this.swap(r1, c1, r2, c2);
    const matches = this.findMatches();
    this.swap(r1, c1, r2, c2);
    return matches.length > 0;
  }
}
