const KEY = 'svt_arkiv_progress';

const DEFAULT = { levelsUnlocked: 1, completed: {} };

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
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ }
}

export function getProgress() { return load(); }

export function isCompleted(levelId) { return !!load().completed[levelId]; }

export function isUnlocked(levelId) { return levelId <= load().levelsUnlocked; }

export function recordCompletion(levelId) {
  const progress = load();
  progress.completed[levelId] = true;
  if (levelId >= progress.levelsUnlocked) progress.levelsUnlocked = levelId + 1;
  save(progress);
  return progress;
}

export function resetProgress() { localStorage.removeItem(KEY); }
