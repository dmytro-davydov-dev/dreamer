// src/features/byok/service/keyStorage.service.ts

const KEY = "dreamer.byok.llmApiKey";
const TRIAL_COUNT_KEY = "dreamer.trial.dreamsUsed";

/** Number of dreams a new user may record using the default API key. */
export const TRIAL_DREAM_LIMIT = 2;

/**
 * Default API key shipped with the app.
 * Allows new users to try 2 dreams without supplying their own key.
 * Sourced from VITE_DEFAULT_LLM_API_KEY at build time — never stored in
 * Firestore or sent anywhere except the OpenAI API endpoint.
 */
const DEFAULT_API_KEY: string | undefined =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_DEFAULT_LLM_API_KEY || undefined;

// ── User-owned key ────────────────────────────────────────────────────────────

/**
 * Store key locally only (never in Firestore).
 * WARNING: localStorage is readable by any JS running on the origin.
 * Only acceptable for MVP with user consent and clear UI.
 */
export function setLlmApiKey(apiKey: string): void {
  localStorage.setItem(KEY, apiKey.trim());
}

export function getLlmApiKey(): string | null {
  const v = localStorage.getItem(KEY);
  return v && v.trim().length ? v : null;
}

export function clearLlmApiKey(): void {
  localStorage.removeItem(KEY);
}

/** True when the user has provided their own API key. */
export function hasLlmApiKey(): boolean {
  return !!getLlmApiKey();
}

// ── Trial tracking ────────────────────────────────────────────────────────────

/** How many dreams the user has already processed with the default key. */
export function getTrialDreamsUsed(): number {
  return parseInt(localStorage.getItem(TRIAL_COUNT_KEY) ?? "0", 10);
}

/** Increment the trial counter (call once per dream AI processing run). */
export function incrementTrialDreamsUsed(): void {
  const current = getTrialDreamsUsed();
  localStorage.setItem(TRIAL_COUNT_KEY, String(current + 1));
}

/** True when the default key exists and the user still has trial dreams left. */
export function hasTrialDreamsRemaining(): boolean {
  return !!DEFAULT_API_KEY && getTrialDreamsUsed() < TRIAL_DREAM_LIMIT;
}

// ── Effective key resolution ──────────────────────────────────────────────────

/**
 * Returns the API key to use for AI calls:
 *  1. The user's own key (if set)
 *  2. The default key (if trial dreams remain)
 *  3. null (user must supply their own key)
 */
export function getEffectiveLlmApiKey(): string | null {
  const userKey = getLlmApiKey();
  if (userKey) return userKey;
  if (DEFAULT_API_KEY && getTrialDreamsUsed() < TRIAL_DREAM_LIMIT) {
    return DEFAULT_API_KEY;
  }
  return null;
}

/**
 * True when the active key is the shared default (not the user's own).
 * Used to gate the "increment trial counter" logic.
 */
export function isUsingDefaultKey(): boolean {
  return !hasLlmApiKey() && hasTrialDreamsRemaining();
}
