/**
 * Shared utility functions used across server and client components.
 */

import { RECENT_MATCH_DAYS } from "./constants";

/**
 * Parse a date string safely, pinning to noon to avoid timezone day-shift.
 * Postgres may return date strings or Date objects — this handles both.
 */
export function safeDate(d: string | Date): Date {
	const raw = typeof d === "string" ? d : d.toISOString();
	return new Date(raw.slice(0, 10) + "T12:00:00");
}

/**
 * Returns true if a match date is within the RECENT_MATCH_DAYS threshold.
 * Used for "Nuevo" badges on recent matches.
 */
export function isRecent(datePlayed: string | Date | null): boolean {
	if (!datePlayed) return false;
	const matchDate = safeDate(datePlayed as string);
	const now = new Date();
	const diffMs = now.getTime() - matchDate.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	return diffDays >= 0 && diffDays <= RECENT_MATCH_DAYS;
}
