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
    label: 'Level 1',
    objective: { type: 'score', target: 2000, moves: 25 },
  },
  {
    id: 2,
    label: 'Level 2',
    objective: { type: 'score', target: 4500, moves: 25 },
  },
  {
    id: 3,
    label: 'Level 3',
    objective: { type: 'blockers', moves: 28 },
    blockerPositions: [
      { row: 2, col: 2 }, { row: 2, col: 5 },
      { row: 4, col: 1 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 6 },
    ],
  },
  {
    id: 4,
    label: 'Level 4',
    objective: { type: 'time', target: 4000, seconds: 60 },
  },
  {
    id: 5,
    label: 'Level 5',
    objective: { type: 'score', target: 8000, moves: 30 },
  },
  {
    id: 6,
    label: 'Level 6',
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
    label: 'Level 7',
    objective: { type: 'time', target: 8000, seconds: 45 },
  },
  {
    id: 8,
    label: 'Level 8',
    objective: { type: 'score', target: 12000, moves: 30 },
  },
];

export function getLevel(id) { return LEVELS.find((l) => l.id === id) ?? LEVELS[0]; }

export function getNextLevel(id) { return LEVELS.find((l) => l.id === id + 1) ?? null; }
