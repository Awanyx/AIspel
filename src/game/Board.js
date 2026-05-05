import { COLS, ROWS, TILE_TYPES } from './constants.js';

// Special tile types in priority order (highest first)
export const SPECIAL_TYPES = ['bolibompa', 'pippi', 'ratatoskr', 'sommarskuggan'];

export class Board {
  constructor() {
    this.grid     = [];
    this.specials = {};  // "row,col" → special type string
    this.blockers = [];  // [row][col] boolean
    this._initBlockers([]);
    this._initGrid();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  _initGrid() {
    do {
      this.grid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => this._randomType())
      );
    } while (this.findMatches().length > 0);
  }

  initBlockers(positions = []) {
    this._initBlockers(positions);
  }

  _initBlockers(positions) {
    this.blockers = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    for (const { row, col } of positions) {
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        this.blockers[row][col] = true;
      }
    }
  }

  _randomType() { return Math.floor(Math.random() * TILE_TYPES); }

  // ─── Accessors ─────────────────────────────────────────────────────────────

  get(row, col)         { return this.grid[row]?.[col] ?? null; }
  set(row, col, type)   { this.grid[row][col] = type; }
  isSpecial(row, col)   { return !!this.specials[`${row},${col}`]; }
  specialType(row, col) { return this.specials[`${row},${col}`] ?? null; }
  isBlocker(row, col)   { return this.blockers[row]?.[col] ?? false; }
  blockerCount()        { return this.blockers.flat().filter(Boolean).length; }

  swap(r1, c1, r2, c2) {
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
    // Carry specials with the swap
    const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;
    const s1 = this.specials[k1], s2 = this.specials[k2];
    if (s1) this.specials[k2] = s1; else delete this.specials[k2];
    if (s2) this.specials[k1] = s2; else delete this.specials[k1];
  }

  wouldMatch(r1, c1, r2, c2) {
    this.swap(r1, c1, r2, c2);
    const has = this.findMatches().length > 0;
    this.swap(r1, c1, r2, c2);
    return has;
  }

  // ─── Match detection ───────────────────────────────────────────────────────

  findMatches() {
    const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    for (let r = 0; r < ROWS; r++) {
      let run = 1;
      for (let c = 1; c <= COLS; c++) {
        const same = c < COLS && this.grid[r][c] !== null && this.grid[r][c] === this.grid[r][c - 1];
        if (same) { run++; }
        else { if (run >= 3) for (let k = c - run; k < c; k++) matched[r][k] = true; run = 1; }
      }
    }
    for (let c = 0; c < COLS; c++) {
      let run = 1;
      for (let r = 1; r <= ROWS; r++) {
        const same = r < ROWS && this.grid[r][c] !== null && this.grid[r][c] === this.grid[r - 1][c];
        if (same) { run++; }
        else { if (run >= 3) for (let k = r - run; k < r; k++) matched[k][c] = true; run = 1; }
      }
    }

    const cells = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (matched[r][c]) cells.push({ row: r, col: c });
    return cells;
  }

  // ─── Special tile detection ────────────────────────────────────────────────

  /**
   * Analyse the matched cells and return [{type, row, col}] for each
   * special tile that should be created.  Only inspects cells whose grid
   * value is non-null (so call BEFORE removal).
   */
  detectSpecials(matchCells) {
    // Group by tile type
    const byType = {};
    for (const { row, col } of matchCells) {
      const t = this.grid[row][col];
      if (t === null) continue;
      (byType[t] = byType[t] ?? []).push({ row, col });
    }

    const results = [];
    for (const cells of Object.values(byType)) {
      // Split into connected components so two separate 3-matches of the
      // same type don't accidentally merge into a false large shape
      for (const component of this._connectedComponents(cells)) {
        const special = this._detectShape(component);
        if (special) results.push(special);
      }
    }
    return results;
  }

  _connectedComponents(cells) {
    const remaining = new Map(cells.map(c => [`${c.row},${c.col}`, c]));
    const components = [];
    for (const [startKey, start] of remaining) {
      if (!remaining.has(startKey)) continue;
      const component = [];
      const queue = [start];
      remaining.delete(startKey);
      while (queue.length) {
        const c = queue.shift();
        component.push(c);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nk = `${c.row+dr},${c.col+dc}`;
          if (remaining.has(nk)) { queue.push(remaining.get(nk)); remaining.delete(nk); }
        }
      }
      components.push(component);
    }
    return components;
  }

  _detectShape(cells) {
    if (cells.length < 4) return null;
    const rows = cells.map(c => c.row);
    const cols = cells.map(c => c.col);
    const minR = Math.min(...rows), maxR = Math.max(...rows);
    const minC = Math.min(...cols), maxC = Math.max(...cols);
    const pivot = cells[Math.floor(cells.length / 2)];

    // Priority 1 — Bolibompa: 5+ cells forming an L or T (spans both axes)
    if (cells.length >= 5 && minR !== maxR && minC !== maxC) {
      return { type: 'bolibompa', row: pivot.row, col: pivot.col };
    }
    // Priority 2 — Pippi: 5+ cells in a straight row
    if (cells.length >= 5 && minR === maxR) {
      return { type: 'pippi', row: pivot.row, col: pivot.col };
    }
    // Priority 3 — Ratatoskr: 4+ cells in a straight column
    if (cells.length >= 4 && minC === maxC) {
      return { type: 'ratatoskr', row: pivot.row, col: pivot.col };
    }
    // Priority 4 — Sommarskuggan: any 2×2 square within the group
    if (cells.length >= 4) {
      const cellSet = new Set(cells.map(c => `${c.row},${c.col}`));
      for (const { row, col } of cells) {
        if (cellSet.has(`${row},${col+1}`) &&
            cellSet.has(`${row+1},${col}`) &&
            cellSet.has(`${row+1},${col+1}`)) {
          return { type: 'sommarskuggan', row, col };
        }
      }
    }
    return null;
  }

  // ─── Special effect computation ───────────────────────────────────────────

  /**
   * Returns the set of extra cells that activating this special clears.
   * The cell itself is already included in the match; this returns ADDITIONAL cells.
   */
  computeSpecialEffect(row, col) {
    const type = this.specials[`${row},${col}`];
    if (!type) return [];
    const cells = [];

    if (type === 'bolibompa') {
      // 3×3 area
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr, c = col + dc;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !(dr === 0 && dc === 0))
            cells.push({ row: r, col: c });
        }
    } else if (type === 'pippi') {
      // Entire row
      for (let c = 0; c < COLS; c++) if (c !== col) cells.push({ row, col: c });
    } else if (type === 'ratatoskr') {
      // Entire column
      for (let r = 0; r < ROWS; r++) if (r !== row) cells.push({ row: r, col });
    } else if (type === 'sommarskuggan') {
      // All tiles of the most-common type on the board
      const counts = Array(TILE_TYPES).fill(0);
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (this.grid[r][c] !== null) counts[this.grid[r][c]]++;
      const target = counts.indexOf(Math.max(...counts));
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (this.grid[r][c] === target && !(r === row && c === col))
            cells.push({ row: r, col: c });
    }
    return cells;
  }

  // ─── Mutation ──────────────────────────────────────────────────────────────

  /**
   * Remove clearCells (except keepCells which become specials).
   * Also destroys blockers adjacent to any cleared cell.
   * Returns { falls, destroyedBlockers }.
   */
  removeAndCreateSpecials(clearCells, keepAsSpecials) {
    const keepKeys  = new Set(keepAsSpecials.map(s => `${s.row},${s.col}`));
    const clearKeys = new Set(clearCells.map(c => `${c.row},${c.col}`));

    // Remove cleared cells (not kept as specials)
    for (const { row, col } of clearCells) {
      if (!keepKeys.has(`${row},${col}`)) {
        this.grid[row][col] = null;
        delete this.specials[`${row},${col}`];
      }
    }

    // Apply new specials to kept positions
    for (const { type, row, col } of keepAsSpecials) {
      this.specials[`${row},${col}`] = type;
    }

    // Check adjacent blockers
    const destroyedBlockers = [];
    for (const { row, col } of clearCells) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.blockers[r][c] && !clearKeys.has(`${r},${c}`)) {
          this.blockers[r][c] = false;
          destroyedBlockers.push({ row: r, col: c });
        }
      }
    }

    return { falls: this.applyGravity(), destroyedBlockers };
  }

  applyGravity() {
    const falls = [];
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (r !== write) {
            falls.push({ col: c, toRow: write, fromRow: r, type: this.grid[r][c] });
            // Carry special along with the tile
            const fromKey = `${r},${c}`, toKey = `${write},${c}`;
            if (this.specials[fromKey]) { this.specials[toKey] = this.specials[fromKey]; delete this.specials[fromKey]; }
            else { delete this.specials[toKey]; }
            this.grid[write][c] = this.grid[r][c];
            this.grid[r][c] = null;
          }
          write--;
        }
      }
    }
    return falls;
  }

  fillEmpty() {
    const spawns = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this.grid[r][c] === null) {
          const type = this._randomType();
          this.grid[r][c] = type;
          spawns.push({ col: c, row: r, type });
        }
    return spawns;
  }
}
