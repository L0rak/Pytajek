// Prosty licznik prób w minutowym oknie, trzymany w pamięci procesu. Przy kilku instancjach serwera limit liczy się osobno na każdej.
const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 10_000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, maxAttempts: number): boolean {
  const entry = attempts.get(key);
  return !!entry && entry.resetAt > Date.now() && entry.count >= maxAttempts;
}

export function recordAttempt(key: string): void {
  const now = Date.now();
  if (attempts.size >= MAX_TRACKED_KEYS) {
    for (const [k, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(k);
    }
    // Same aktywne wpisy: usuwamy najstarszy, żeby zalew prób nie zapełnił pamięci.
    if (attempts.size >= MAX_TRACKED_KEYS) {
      const oldest = attempts.keys().next().value;
      if (oldest !== undefined) attempts.delete(oldest);
    }
  }

  const entry = attempts.get(key);
  if (entry && entry.resetAt > now) {
    entry.count++;
  } else {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
}
