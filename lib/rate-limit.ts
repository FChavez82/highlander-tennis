/**
 * Simple in-memory rate limiter.
 *
 * Tracks attempts per key (typically IP address) within a sliding window.
 * Not suitable for multi-instance deployments — use Redis for that.
 * Good enough for a single-server tournament app.
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Periodically clean up expired entries to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 60_000;
setInterval(() => {
	const now = Date.now();
	store.forEach((entry, key) => {
		if (now > entry.resetAt) store.delete(key);
	});
}, CLEANUP_INTERVAL_MS);

/**
 * Check if a key has exceeded the rate limit.
 *
 * @param key       Unique identifier (e.g. IP address)
 * @param maxAttempts  Max allowed attempts within the window
 * @param windowMs     Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function rateLimit(
	key: string,
	maxAttempts: number,
	windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
	const now = Date.now();
	const entry = store.get(key);

	/* No existing entry or window expired — allow and start fresh */
	if (!entry || now > entry.resetAt) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
	}

	/* Within window — check if limit exceeded */
	if (entry.count >= maxAttempts) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterMs: entry.resetAt - now,
		};
	}

	/* Still within limit — increment */
	entry.count++;
	return {
		allowed: true,
		remaining: maxAttempts - entry.count,
		retryAfterMs: 0,
	};
}
