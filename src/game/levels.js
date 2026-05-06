/**
 * 8-level structure per the GDD.
 * objective.type: "score" | "blockers" | "time"
 *   score   → target (pts), moves
 *   blockers→ moves; blockerPositions defines the layout
 *   time    → target (pts), seconds
 */
export const LEVELS = [
  {
    id: 1,
    label: 'Nivå 1',
    tileTypes: 5,
    objective: { type: 'score', target: 2500, moves: 28 },
  },
  {
    id: 2,
    label: 'Nivå 2',
    tileTypes: 6,
    objective: { type: 'score', target: 3000, moves: 26 },
  },
  {
    id: 3,
    label: 'Nivå 3',
    tileTypes: 6,
    objective: { type: 'blockers', moves: 28 },
    blockerPositions: [
      { row: 2, col: 2 }, { row: 2, col: 5 },
      { row: 4, col: 1 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 6 },
    ],
  },
  {
    id: 4,
    label: 'Nivå 4',
    tileTypes: 7,
    objective: { type: 'time', target: 2000, seconds: 75 },
  },
  {
    id: 5,
    label: 'Nivå 5',
    tileTypes: 8,
    objective: { type: 'score', target: 4000, moves: 30 },
  },
  {
    id: 6,
    label: 'Nivå 6',
    tileTypes: 8,
    objective: { type: 'blockers', moves: 30 },
    blockerPositions: [
      { row: 1, col: 1 }, { row: 1, col: 6 },
      { row: 3, col: 3 }, { row: 3, col: 4 },
      { row: 5, col: 0 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 5, col: 7 },
      { row: 7, col: 3 }, { row: 7, col: 4 },
    ],
  },
  {
    id: 7,
    label: 'Nivå 7',
    tileTypes: 9,
    objective: { type: 'time', target: 2700, seconds: 55 },
  },
  {
    id: 8,
    label: 'Nivå 8',
    tileTypes: 11,
    // Exclude ratatoskr (index 2)
    tilePool: [0, 1, 3, 4, 5, 6, 7, 8, 9, 10],
    objective: { type: 'score', target: 5500, moves: 30 },
  },
];

export function getLevel(id) { return LEVELS.find((l) => l.id === id) ?? LEVELS[0]; }

export function getNextLevel(id) { return LEVELS.find((l) => l.id === id + 1) ?? null; }
