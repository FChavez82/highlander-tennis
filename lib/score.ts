/**
 * Shared score-parsing utilities.
 *
 * Centralises all tennis score logic (parsing, set counting, winner determination)
 * so it's not duplicated across server and client components.
 */

/* ── Types ── */

export type ParsedSet = { a: number; b: number; isTiebreak: boolean };

/* ── Parsing ── */

/**
 * Parse a score string like "6-4, 3-6, [10-7]" into individual sets.
 * Returns an array of parsed sets with game counts and tiebreak flag.
 */
export function parseSets(score: string): ParsedSet[] {
	if (!score) return [];
	return score
		.split(",")
		.map((s) => {
			const trimmed = s.trim();
			/* Super-tiebreak: [10-7] */
			const tbMatch = trimmed.match(/\[(\d+)-(\d+)\]/);
			if (tbMatch) {
				return { a: parseInt(tbMatch[1]), b: parseInt(tbMatch[2]), isTiebreak: true };
			}
			/* Regular set: 6-4 */
			const parts = trimmed.split("-").map((n) => parseInt(n.trim()));
			if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
				return { a: parts[0], b: parts[1], isTiebreak: false };
			}
			return null;
		})
		.filter((s): s is ParsedSet => s !== null);
}

/* ── Winner determination ── */

/**
 * Determine which side won from parsed sets.
 * Returns "a" if player A won more sets, "b" if player B, null if tie/unknown.
 */
export function getWinner(sets: ParsedSet[]): "a" | "b" | null {
	let aWins = 0;
	let bWins = 0;
	for (const s of sets) {
		if (s.a > s.b) aWins++;
		else if (s.b > s.a) bWins++;
	}
	if (aWins > bWins) return "a";
	if (bWins > aWins) return "b";
	return null;
}

/**
 * Determine the winner of a match given player IDs and a score string.
 * Returns the winning player's ID.
 *
 * This is the ID-based version used by server-side code (db.ts, page components).
 */
export function determineWinner(
	playerAId: number,
	playerBId: number,
	score: string
): number {
	const sets = parseSets(score);
	const winner = getWinner(sets);
	return winner === "b" ? playerBId : playerAId;
}

/* ── Set counting ── */

/**
 * Count sets won by each side from a score string.
 * Used for set-difference calculations in standings.
 */
export function countSets(score: string): { aSets: number; bSets: number } {
	const sets = parseSets(score);
	let aSets = 0;
	let bSets = 0;
	for (const s of sets) {
		if (s.a > s.b) aSets++;
		else if (s.b > s.a) bSets++;
	}
	return { aSets, bSets };
}
