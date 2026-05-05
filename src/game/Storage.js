const KEY = 'svt_arkiv_progress';

const DEFAULT = {
  levelsUnlocked: 1,
  stars: {},
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
}

export function getProgress() {
  return load();
}

/** Returns the best (highest) star count saved for a level. */
export function getStars(levelId) {
  return load().stars[levelId] ?? 0;
}

/** Returns true if levelId is unlocked. */
export function isUnlocked(levelId) {
  return levelId <= load().levelsUnlocked;
}

/**
 * Record a level completion. Saves stars if better than previous,
 * and unlocks the next level. Returns the updated progress object.
 */
export function recordCompletion(levelId, stars) {
  const progress = load();
  const prev = progress.stars[levelId] ?? 0;
  if (stars > prev) progress.stars[levelId] = stars;
  if (levelId >= progress.levelsUnlocked) {
    progress.levelsUnlocked = levelId + 1;
  }
  save(progress);
  return progress;
}

/** Wipe all progress (for dev/testing). */
export function resetProgress() {
  localStorage.removeItem(KEY);
}
