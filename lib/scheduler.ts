/**
 * Matching algorithm for the bi-weekly scheduling system.
 *
 * Given a set of available players for a week + category, this module:
 * 1. Checks all existing matchups (played + scheduled) to prevent duplicates
 * 2. Assigns a bye fairly if there's an odd number of players
 * 3. Uses a greedy "most-constrained-first" algorithm to pair players
 *
 * The algorithm prioritises players with fewer available opponents so that
 * hard-to-pair players get matched before easier ones. This heuristic
 * produces near-optimal results for typical tournament sizes (8–20 players).
 */
import { sql } from "@vercel/postgres";
import type { Category } from "./constants";

/* ================================================================
   Types
   ================================================================ */

export interface ScheduleInput {
	weekId: number;
	category: Category;
	availablePlayerIds: number[];
}

export interface ScheduleOutput {
	pairings: Array<{ playerAId: number; playerBId: number }>;
	bye: number | null;
	/** Players who couldn't be paired (all opponents already played) */
	unpairedIds: number[];
}

/* ================================================================
   Helpers
   ================================================================ */

/**
 * Build a canonical "min-max" key for a pair of player IDs.
 * Used to de-duplicate matchups regardless of who is player_a vs player_b.
 */
function matchupKey(a: number, b: number): string {
	return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/**
 * Get all existing matchups in a category (played + scheduled, round_robin only).
 * Returns a Set of "minId-maxId" strings for O(1) duplicate checking.
 */
export async function getExistingMatchups(category: Category): Promise<Set<string>> {
	/* Exclude cancelled matches — cancelled pairings become available again */
	const { rows } = await sql`
		SELECT player_a_id, player_b_id FROM matches
		WHERE category = ${category}
		  AND COALESCE(phase, 'round_robin') = 'round_robin'
		  AND player_a_id IS NOT NULL
		  AND player_b_id IS NOT NULL
		  AND status != 'cancelado';
	`;
	const set = new Set<string>();
	for (const r of rows) {
		set.add(matchupKey(r.player_a_id, r.player_b_id));
	}
	return set;
}

/**
 * Get bye history for a category — how many times each player has received a bye.
 *
 * A "bye" is defined as: the player was available for a week but was NOT assigned
 * any match for that week. We derive this from the data rather than storing it
 * in a separate table, keeping the schema simple.
 */
export async function getByeHistory(category: Category): Promise<Map<number, number>> {
	const { rows } = await sql`
		SELECT pa.player_id, COUNT(*)::int AS bye_count
		FROM player_availability pa
		JOIN schedule_weeks sw ON sw.id = pa.week_id
		JOIN players p ON p.id = pa.player_id
		WHERE pa.available = true
		  AND p.category = ${category}
		  AND NOT EXISTS (
		      SELECT 1 FROM matches m
		      WHERE m.week_id = pa.week_id
		        AND (m.player_a_id = pa.player_id OR m.player_b_id = pa.player_id)
		  )
		GROUP BY pa.player_id;
	`;
	const map = new Map<number, number>();
	for (const r of rows) {
		map.set(r.player_id, r.bye_count);
	}
	return map;
}

/* ================================================================
   Core Algorithm
   ================================================================ */

/**
 * Generate pairings for a single week + category.
 *
 * Algorithm:
 * 1. If odd number of available players, pick the bye player (fewest past byes)
 * 2. Build an adjacency graph of valid (non-duplicate) pairings
 * 3. Sort players by number of available opponents ascending (most constrained first)
 * 4. Greedily match: for each unmatched player, pair with the most-constrained
 *    available opponent. This heuristic works well for typical tournament sizes.
 * 5. Any player who can't be paired (all opponents exhausted) goes to unpairedIds.
 */
export async function generateWeekPairings(input: ScheduleInput): Promise<ScheduleOutput> {
	const { category, availablePlayerIds } = input;

	/* Not enough players to make any match */
	if (availablePlayerIds.length < 2) {
		return {
			pairings: [],
			bye: availablePlayerIds[0] ?? null,
			unpairedIds: [],
		};
	}

	const existingMatchups = await getExistingMatchups(category);
	const byeHistory = await getByeHistory(category);

	let players = [...availablePlayerIds];
	let bye: number | null = null;

	/* ── Step 1: Handle odd number of players ────────────────── */
	if (players.length % 2 !== 0) {
		/* Sort by bye count ascending — player with the FEWEST past byes
		   gets the next bye (fair rotation). Ties broken by player ID for consistency. */
		players.sort((a, b) => {
			const aCount = byeHistory.get(a) ?? 0;
			const bCount = byeHistory.get(b) ?? 0;
			if (aCount !== bCount) return aCount - bCount;
			return a - b;
		});

		/* Remove the first player (fewest byes) — they get the bye */
		bye = players.shift()!;
	}

	/* ── Step 2: Build adjacency graph of valid pairings ─────── */
	const canPlay = new Map<number, Set<number>>();
	for (const p of players) canPlay.set(p, new Set());

	for (let i = 0; i < players.length; i++) {
		for (let j = i + 1; j < players.length; j++) {
			const key = matchupKey(players[i], players[j]);
			if (!existingMatchups.has(key)) {
				canPlay.get(players[i])!.add(players[j]);
				canPlay.get(players[j])!.add(players[i]);
			}
		}
	}

	/* ── Step 3: Greedy maximum matching (most-constrained-first) ── */
	const pairings: Array<{ playerAId: number; playerBId: number }> = [];
	const paired = new Set<number>();

	/* Sort by number of available opponents ascending —
	   most constrained players get matched first */
	const sorted = [...players].sort(
		(a, b) => (canPlay.get(a)?.size ?? 0) - (canPlay.get(b)?.size ?? 0)
	);

	for (const p of sorted) {
		if (paired.has(p)) continue;

		const candidates = canPlay.get(p);
		if (!candidates) continue;

		/* Find best unpaired opponent (also most-constrained-first) */
		let bestOpponent: number | null = null;
		let bestSize = Infinity;

		for (const opp of Array.from(candidates)) {
			if (paired.has(opp)) continue;
			const oppSize = canPlay.get(opp)?.size ?? 0;
			if (oppSize < bestSize) {
				bestSize = oppSize;
				bestOpponent = opp;
			}
		}

		if (bestOpponent !== null) {
			/* Always put the lower ID as playerA for consistency */
			pairings.push({
				playerAId: Math.min(p, bestOpponent),
				playerBId: Math.max(p, bestOpponent),
			});
			paired.add(p);
			paired.add(bestOpponent);
		}
	}

	/* ── Step 4: Collect unpaired players (all matchups exhausted) ── */
	const unpairedIds = players.filter((p) => !paired.has(p));

	return { pairings, bye, unpairedIds };
}
