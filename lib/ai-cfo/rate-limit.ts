export type RateLimitState = Map<string, number[]>;

export function createRateLimitState(): RateLimitState {
  return new Map();
}

export function consumeRateLimit(
  state: RateLimitState,
  userId: string,
  limit: number,
  now = Date.now(),
  windowMs = 60 * 60 * 1000,
) {
  const recent = (state.get(userId) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    state.set(userId, recent);
    return {
      allowed: false as const,
      retryAfterMs: Math.max(0, windowMs - (now - recent[0])),
    };
  }

  recent.push(now);
  state.set(userId, recent);
  return { allowed: true as const };
}

const globalState = createRateLimitState();

export function consumeAiCfoRateLimit(userId: string, limit: number) {
  return consumeRateLimit(globalState, userId, limit);
}
