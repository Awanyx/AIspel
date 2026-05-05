/**
 * Level definitions for SVT Arkiv.
 * objective.type: "score" | "blockers" | "time"  (only "score" active in this build)
 * starThresholds: [1-star, 2-star, 3-star] minimum scores
 */
export const LEVELS = [
  {
    id: 1,
    label: 'Level 1',
    gridSize: { cols: 8, rows: 8 },
    objective: { type: 'score', target: 2000, moves: 25 },
    starThresholds: [2000, 2400, 3000],
  },
  {
    id: 2,
    label: 'Level 2',
    gridSize: { cols: 8, rows: 8 },
    objective: { type: 'score', target: 4000, moves: 25 },
    starThresholds: [4000, 4800, 6000],
  },
  {
    id: 3,
    label: 'Level 3',
    gridSize: { cols: 8, rows: 8 },
    objective: { type: 'score', target: 6000, moves: 28 },
    starThresholds: [6000, 7200, 9000],
  },
  {
    id: 4,
    label: 'Level 4',
    gridSize: { cols: 8, rows: 8 },
    objective: { type: 'score', target: 8000, moves: 30 },
    starThresholds: [8000, 9600, 12000],
  },
  {
    id: 5,
    label: 'Level 5',
    gridSize: { cols: 8, rows: 8 },
    objective: { type: 'score', target: 10000, moves: 30 },
    starThresholds: [10000, 12000, 15000],
  },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function getNextLevel(id) {
  return LEVELS.find((l) => l.id === id + 1) ?? null;
}

/** Compute 0–3 stars for a given score against a level's thresholds. */
export function calcStars(level, score) {
  const [t1, t2, t3] = level.starThresholds;
  if (score >= t3) return 3;
  if (score >= t2) return 2;
  if (score >= t1) return 1;
  return 0;
}
