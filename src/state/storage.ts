import type { LanguagePreference, LevelProgress, SaveState, UpgradeId } from '../types';

export const STORAGE_KEY = 'farmacia_gallego_save_v1';

const VALID_UPGRADE_IDS: ReadonlySet<UpgradeId> = new Set<UpgradeId>([
  'uv_loupe',
  'digital_scale',
  'laser_cutter',
  'climate_control',
  'espresso_bar',
]);

const VALID_LANGUAGE_PREFS: ReadonlySet<LanguagePreference> = new Set<LanguagePreference>([
  'auto',
  'es',
  'en',
]);

export function createDefaultSaveState(): SaveState {
  return {
    version: 1,
    languagePreference: 'auto',
    unlockedLevel: 1,
    euros: 60,
    reputation: 100,
    upgrades: [],
    levelProgress: {},
    soundMuted: false,
    totalPatientsServed: 0,
  };
}

/**
 * Strictly validates and sanitizes untrusted JSON from localStorage to prevent
 * state corruption or prototype/XSS injection. Fails safe to default state.
 */
export function validateAndSanitizeSaveState(raw: unknown): SaveState {
  const fallback = createDefaultSaveState();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fallback;
  }

  const record = raw as Record<string, unknown>;
  if (record.version !== 1) {
    return fallback;
  }

  const languagePreference: LanguagePreference =
    typeof record.languagePreference === 'string' &&
    VALID_LANGUAGE_PREFS.has(record.languagePreference as LanguagePreference)
      ? (record.languagePreference as LanguagePreference)
      : 'auto';

  const unlockedLevel =
    typeof record.unlockedLevel === 'number' &&
    Number.isInteger(record.unlockedLevel) &&
    record.unlockedLevel >= 1 &&
    record.unlockedLevel <= 10
      ? record.unlockedLevel
      : 1;

  const euros =
    typeof record.euros === 'number' &&
    Number.isFinite(record.euros) &&
    record.euros >= 0 &&
    record.euros <= 1_000_000
      ? Math.round(record.euros * 100) / 100
      : 60;

  const reputation =
    typeof record.reputation === 'number' &&
    Number.isFinite(record.reputation) &&
    record.reputation >= 0 &&
    record.reputation <= 100
      ? Math.round(record.reputation)
      : 100;

  const upgrades: UpgradeId[] = [];
  if (Array.isArray(record.upgrades)) {
    for (const item of record.upgrades) {
      if (
        typeof item === 'string' &&
        VALID_UPGRADE_IDS.has(item as UpgradeId) &&
        !upgrades.includes(item as UpgradeId)
      ) {
        upgrades.push(item as UpgradeId);
      }
    }
  }

  const levelProgress: Record<number, LevelProgress> = {};
  if (
    typeof record.levelProgress === 'object' &&
    record.levelProgress !== null &&
    !Array.isArray(record.levelProgress)
  ) {
    const rawProgress = record.levelProgress as Record<string, unknown>;
    for (let lvl = 1; lvl <= 10; lvl++) {
      const entry = rawProgress[String(lvl)];
      if (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
        const entryObj = entry as Record<string, unknown>;
        const completed = Boolean(entryObj.completed);
        const stars =
          typeof entryObj.stars === 'number' &&
          Number.isInteger(entryObj.stars) &&
          entryObj.stars >= 0 &&
          entryObj.stars <= 3
            ? entryObj.stars
            : 0;
        const bestScore =
          typeof entryObj.bestScore === 'number' &&
          Number.isFinite(entryObj.bestScore) &&
          entryObj.bestScore >= 0 &&
          entryObj.bestScore <= 100_000
            ? Math.round(entryObj.bestScore)
            : 0;
        levelProgress[lvl] = { completed, stars, bestScore };
      }
    }
  }

  const soundMuted = typeof record.soundMuted === 'boolean' ? record.soundMuted : false;
  const totalPatientsServed =
    typeof record.totalPatientsServed === 'number' &&
    Number.isInteger(record.totalPatientsServed) &&
    record.totalPatientsServed >= 0 &&
    record.totalPatientsServed <= 1_000_000
      ? record.totalPatientsServed
      : 0;

  return {
    version: 1,
    languagePreference,
    unlockedLevel,
    euros,
    reputation,
    upgrades,
    levelProgress,
    soundMuted,
    totalPatientsServed,
  };
}

export function loadSaveState(storage?: Storage): SaveState {
  try {
    const targetStorage =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!targetStorage) {
      return createDefaultSaveState();
    }
    const rawJson = targetStorage.getItem(STORAGE_KEY);
    if (!rawJson) {
      return createDefaultSaveState();
    }
    const parsed: unknown = JSON.parse(rawJson);
    return validateAndSanitizeSaveState(parsed);
  } catch {
    return createDefaultSaveState();
  }
}

export function persistSaveState(state: SaveState, storage?: Storage): void {
  try {
    const targetStorage =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!targetStorage) {
      return;
    }
    const sanitized = validateAndSanitizeSaveState(state);
    targetStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore quota errors in restricted browsing modes
  }
}

export function resetSaveState(storage?: Storage): SaveState {
  const fresh = createDefaultSaveState();
  persistSaveState(fresh, storage);
  return fresh;
}
