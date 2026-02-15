/**
 * Database helper — all SQL queries for the tournament live here.
 *
 * Uses @vercel/postgres which reads POSTGRES_URL from env automatically.
 */
import { sql } from "@vercel/postgres";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	STATUS_PENDING,
	STATUS_PLAYED,
	PHASE_ROUND_ROBIN,
	PHASE_BRACKET,
	BRACKET_ROUND_SEMIFINAL,
	BRACKET_ROUND_FINAL,
	BRACKET_ROUND_THIRD_PLACE,
	type Category,
	type MatchStatus,
	type Phase,
	type BracketRound,
} from "./constants";

/* ================================================================
   Types
   ================================================================ */

export interface Player {
	id: number;
	name: string;
	category: Category;
	created_at: string;
}

export interface Match {
	id: number;
	player_a_id: number;
	player_b_id: number;
	category: Category;
	status: MatchStatus;
	score: string | null;
	date_played: string | null;
	phase: Phase;
	bracket_round: BracketRound | null;
	created_at: string;
	/* Joined fields (populated by some queries) */
	player_a_name?: string;
	player_b_name?: string;
}

export interface Standing {
	id: number;
	name: string;
	category: Category;
	played: number;
	won: number;
	lost: number;
	pending: number;
	sets_won: number;
	sets_lost: number;
}

/* ================================================================
   Players
   ================================================================ */

/**
 * Get all players, optionally filtered by category.
 * Returns each player with counts of matches played & pending.
 */
export async function getPlayers(category?: string): Promise<Standing[]> {
	/* Build query — if category is provided, filter by it */
	/* Only count round_robin matches for standings (bracket matches don't affect ranking) */
	if (category) {
		const { rows } = await sql`
			SELECT
				p.id,
				p.name,
				p.category,
				COUNT(CASE WHEN m.status = 'jugado' THEN 1 END)::int     AS played,
				COUNT(CASE WHEN m.status = 'pendiente' THEN 1 END)::int  AS pending
			FROM players p
			LEFT JOIN matches m
				ON (m.player_a_id = p.id OR m.player_b_id = p.id)
				AND COALESCE(m.phase, 'round_robin') = 'round_robin'
			WHERE p.category = ${category}
			GROUP BY p.id, p.name, p.category
			ORDER BY p.name;
		`;
		/* Calculate won/lost from a separate query for clarity */
		return addWinLoss(rows as Standing[]);
	}

	const { rows } = await sql`
		SELECT
			p.id,
			p.name,
			p.category,
			COUNT(CASE WHEN m.status = 'jugado' THEN 1 END)::int     AS played,
			COUNT(CASE WHEN m.status = 'pendiente' THEN 1 END)::int  AS pending
		FROM players p
		LEFT JOIN matches m
			ON (m.player_a_id = p.id OR m.player_b_id = p.id)
			AND COALESCE(m.phase, 'round_robin') = 'round_robin'
		GROUP BY p.id, p.name, p.category
		ORDER BY p.name;
	`;
	return addWinLoss(rows as Standing[]);
}

/**
 * Adds won/lost counts to each player's standing.
 * A player "wins" a match when their total games won > opponent's total,
 * based on the score string (e.g. "6-4, 3-6, [10-7]").
 */
async function addWinLoss(standings: Standing[]): Promise<Standing[]> {
	/* Fetch all completed round_robin matches to compute wins/losses (bracket doesn't count) */
	const { rows: matches } = await sql`
		SELECT id, player_a_id, player_b_id, score
		FROM matches
		WHERE status = 'jugado' AND score IS NOT NULL
		  AND COALESCE(phase, 'round_robin') = 'round_robin';
	`;

	/* Build a map: playerId → { won, lost, sets_won, sets_lost } */
	const record: Record<number, { won: number; lost: number; sets_won: number; sets_lost: number }> = {};

	const ensure = (id: number) => {
		if (!record[id]) record[id] = { won: 0, lost: 0, sets_won: 0, sets_lost: 0 };
	};

	for (const m of matches) {
		const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score);
		const loserId = winnerId === m.player_a_id ? m.player_b_id : m.player_a_id;

		ensure(winnerId);
		ensure(loserId);

		record[winnerId].won++;
		record[loserId].lost++;

		/* Count sets won/lost per player from the score string */
		const { aSets, bSets } = countSets(m.score);
		record[m.player_a_id].sets_won += aSets;
		record[m.player_a_id].sets_lost += bSets;
		record[m.player_b_id].sets_won += bSets;
		record[m.player_b_id].sets_lost += aSets;
	}

	return standings.map((s) => ({
		...s,
		won: record[s.id]?.won ?? 0,
		lost: record[s.id]?.lost ?? 0,
		sets_won: record[s.id]?.sets_won ?? 0,
		sets_lost: record[s.id]?.sets_lost ?? 0,
	}));
}

/**
 * Counts the number of sets won by each side (player A / player B)
 * from a score string like "6-4, 3-6, [10-7]".
 */
function countSets(score: string): { aSets: number; bSets: number } {
	const sets = score.split(",").map((s) => s.trim());
	let aSets = 0;
	let bSets = 0;

	for (const set of sets) {
		/* Super-tiebreak format: [10-7] */
		const tbMatch = set.match(/\[(\d+)-(\d+)\]/);
		if (tbMatch) {
			const a = parseInt(tbMatch[1]);
			const b = parseInt(tbMatch[2]);
			if (a > b) aSets++;
			else bSets++;
			continue;
		}

		/* Normal set: "6-4" */
		const parts = set.split("-").map((n) => parseInt(n.trim()));
		if (parts.length === 2) {
			if (parts[0] > parts[1]) aSets++;
			else if (parts[1] > parts[0]) bSets++;
		}
	}

	return { aSets, bSets };
}

/**
 * Determines the winner of a match from the score string.
 *
 * Score format examples:
 * - "6-4, 6-2"           → player who won 2 sets
 * - "6-4, 3-6, [10-7]"   → player who won the super-tiebreak
 * - "6-4, 3-6, 7-5"      → player who won 2 of 3 sets
 *
 * Returns the winning player's ID.
 */
export function determineWinner(
	playerAId: number,
	playerBId: number,
	score: string
): number {
	const sets = score.split(",").map((s) => s.trim());
	let aWins = 0;
	let bWins = 0;

	for (const set of sets) {
		/* Super-tiebreak format: [10-7] */
		const tbMatch = set.match(/\[(\d+)-(\d+)\]/);
		if (tbMatch) {
			const a = parseInt(tbMatch[1]);
			const b = parseInt(tbMatch[2]);
			if (a > b) aWins++;
			else bWins++;
			continue;
		}

		/* Normal set: "6-4" */
		const parts = set.split("-").map((n) => parseInt(n.trim()));
		if (parts.length === 2) {
			if (parts[0] > parts[1]) aWins++;
			else if (parts[1] > parts[0]) bWins++;
		}
	}

	return aWins >= bWins ? playerAId : playerBId;
}

/**
 * Create a new player and generate round-robin matches against
 * all existing players in the same category.
 */
export async function createPlayer(
	name: string,
	category: Category
): Promise<Player> {
	/* Insert the new player */
	const { rows } = await sql`
		INSERT INTO players (name, category)
		VALUES (${name}, ${category})
		RETURNING *;
	`;
	const newPlayer = rows[0] as Player;

	/* Get all existing players in the same category (excluding the new one) */
	const { rows: existing } = await sql`
		SELECT id FROM players
		WHERE category = ${category} AND id != ${newPlayer.id};
	`;

	/* Create a match for each existing player in the same category */
	for (const other of existing) {
		await sql`
			INSERT INTO matches (player_a_id, player_b_id, category)
			VALUES (${newPlayer.id}, ${other.id}, ${category});
		`;
	}

	return newPlayer;
}

/**
 * Delete a player. CASCADE will remove their matches automatically
 * thanks to the FK constraint, but we also explicitly remove only
 * pending matches to preserve played results.
 *
 * Note: We delete ALL matches for this player (pending + played)
 * since removing a player invalidates their results.
 */
export async function deletePlayer(id: number): Promise<void> {
	await sql`DELETE FROM players WHERE id = ${id};`;
}

/* ================================================================
   Matches
   ================================================================ */

/**
 * Get matches with player names joined, optionally filtered by category and/or status.
 *
 * Uses a single query with conditional WHERE clauses:
 * when a filter param is NULL the corresponding condition is skipped.
 */
export async function getMatches(
	category?: string,
	status?: string,
	phase?: string
): Promise<Match[]> {
	const { rows } = await sql`
		SELECT
			m.*,
			pa.name AS player_a_name,
			pb.name AS player_b_name
		FROM matches m
		LEFT JOIN players pa ON pa.id = m.player_a_id
		LEFT JOIN players pb ON pb.id = m.player_b_id
		WHERE (${category ?? null}::text IS NULL OR m.category = ${category ?? null})
		  AND (${status ?? null}::text IS NULL OR m.status = ${status ?? null})
		  AND (${phase ?? null}::text IS NULL OR COALESCE(m.phase, 'round_robin') = ${phase ?? null})
		ORDER BY m.date_played DESC NULLS LAST, m.id;
	`;
	return rows as Match[];
}

/**
 * Update a match result — sets status to 'jugado'.
 */
export async function updateMatch(
	id: number,
	score: string,
	datePlayed: string
): Promise<Match> {
	const { rows } = await sql`
		UPDATE matches
		SET score = ${score},
		    date_played = ${datePlayed},
		    status = 'jugado'
		WHERE id = ${id}
		RETURNING *;
	`;
	return rows[0] as Match;
}

/**
 * Reset a match back to pending (clear result).
 */
export async function resetMatch(id: number): Promise<Match> {
	const { rows } = await sql`
		UPDATE matches
		SET score = NULL,
		    date_played = NULL,
		    status = 'pendiente'
		WHERE id = ${id}
		RETURNING *;
	`;
	return rows[0] as Match;
}

/**
 * Delete a single match.
 */
export async function deleteMatch(id: number): Promise<void> {
	await sql`DELETE FROM matches WHERE id = ${id};`;
}

/**
 * Generate all round-robin pairings for a given category.
 * This deletes ALL existing matches for the category first,
 * then creates N*(N-1)/2 pairings.
 */
export async function generateRoundRobin(category: Category): Promise<number> {
	/* Get all players in this category */
	const { rows: players } = await sql`
		SELECT id FROM players
		WHERE category = ${category}
		ORDER BY id;
	`;

	/* Delete all existing matches for this category */
	await sql`DELETE FROM matches WHERE category = ${category};`;

	/* Generate all pairings */
	let count = 0;
	for (let i = 0; i < players.length; i++) {
		for (let j = i + 1; j < players.length; j++) {
			await sql`
				INSERT INTO matches (player_a_id, player_b_id, category)
				VALUES (${players[i].id}, ${players[j].id}, ${category});
			`;
			count++;
		}
	}

	return count;
}

/* ================================================================
   Bracket (Phase 2 — elimination)
   ================================================================ */

/**
 * Sort standings for ranking: points desc → set diff desc → name asc.
 * Same logic used in /clasificacion for seeding.
 */
export function sortStandings(a: Standing, b: Standing): number {
	/* 1. Points (wins) descending */
	if (b.won !== a.won) return b.won - a.won;
	/* 2. Set difference descending */
	const aDiff = a.sets_won - a.sets_lost;
	const bDiff = b.sets_won - b.sets_lost;
	if (bDiff !== aDiff) return bDiff - aDiff;
	/* 3. Name alphabetical ascending */
	return a.name.localeCompare(b.name);
}

/**
 * Generate bracket matches for a category from Phase 1 standings.
 *
 * Takes the top N (qualifiers) players from sorted standings and creates:
 * - Semifinal matches: #1 vs #N, #2 vs #(N-1) (standard seeding)
 * - Placeholder final match (filled after semis)
 * - Placeholder 3rd-place match (filled after semis)
 *
 * Returns the IDs of all created bracket matches.
 */
export async function generateBracket(
	category: Category,
	qualifiers: number
): Promise<{ created: number; matchIds: number[] }> {
	/* Get sorted standings for seeding */
	const standings = await getPlayers(category);
	standings.sort(sortStandings);

	/* Take the top N qualifiers */
	const seeds = standings.slice(0, qualifiers);

	if (seeds.length < qualifiers) {
		throw new Error(
			`No hay suficientes jugadores. Se necesitan ${qualifiers}, hay ${seeds.length}.`
		);
	}

	/* Delete any existing bracket matches for this category before regenerating */
	await sql`
		DELETE FROM matches
		WHERE category = ${category}
		  AND COALESCE(phase, 'round_robin') = 'bracket';
	`;

	const matchIds: number[] = [];

	/* Create semifinal matches with standard seeding: #1 vs #N, #2 vs #(N-1), etc. */
	const numSemis = qualifiers / 2;
	for (let i = 0; i < numSemis; i++) {
		const topSeed = seeds[i];
		const bottomSeed = seeds[qualifiers - 1 - i];

		const { rows } = await sql`
			INSERT INTO matches (player_a_id, player_b_id, category, phase, bracket_round)
			VALUES (${topSeed.id}, ${bottomSeed.id}, ${category}, 'bracket', 'semifinal')
			RETURNING id;
		`;
		matchIds.push(rows[0].id);
	}

	/* Create placeholder final match — player IDs are NULL until semis are played */
	const { rows: finalRows } = await sql`
		INSERT INTO matches (player_a_id, player_b_id, category, phase, bracket_round)
		VALUES (NULL, NULL, ${category}, 'bracket', 'final')
		RETURNING id;
	`;
	matchIds.push(finalRows[0].id);

	/* Create placeholder 3rd-place match — also NULL until semis are played */
	const { rows: thirdRows } = await sql`
		INSERT INTO matches (player_a_id, player_b_id, category, phase, bracket_round)
		VALUES (NULL, NULL, ${category}, 'bracket', 'third_place')
		RETURNING id;
	`;
	matchIds.push(thirdRows[0].id);

	return { created: matchIds.length, matchIds };
}

/**
 * After a bracket match result is entered, auto-populate the next round.
 *
 * - Winners of both semifinals → final
 * - Losers of both semifinals → 3rd-place match
 *
 * Only advances when BOTH semifinals in the category are completed.
 */
export async function advanceBracket(matchId: number): Promise<void> {
	/* Get the match that was just updated */
	const { rows: matchRows } = await sql`
		SELECT * FROM matches WHERE id = ${matchId};
	`;
	const match = matchRows[0] as Match;

	/* Only process bracket semifinal matches */
	if (match.phase !== PHASE_BRACKET || match.bracket_round !== BRACKET_ROUND_SEMIFINAL) {
		return;
	}

	/* Check if ALL semifinals in this category are completed */
	const { rows: semis } = await sql`
		SELECT * FROM matches
		WHERE category = ${match.category}
		  AND phase = 'bracket'
		  AND bracket_round = 'semifinal'
		ORDER BY id;
	`;

	const allPlayed = semis.every((s) => s.status === STATUS_PLAYED && s.score);
	if (!allPlayed) return;

	/* Determine winners and losers of each semifinal */
	const results = semis.map((s) => {
		const winnerId = determineWinner(s.player_a_id, s.player_b_id, s.score);
		const loserId = winnerId === s.player_a_id ? s.player_b_id : s.player_a_id;
		return { winnerId, loserId };
	});

	/* Update the final match: winners of SF1 and SF2 */
	await sql`
		UPDATE matches
		SET player_a_id = ${results[0].winnerId},
		    player_b_id = ${results[1].winnerId}
		WHERE category = ${match.category}
		  AND phase = 'bracket'
		  AND bracket_round = 'final';
	`;

	/* Update the 3rd-place match: losers of SF1 and SF2 */
	await sql`
		UPDATE matches
		SET player_a_id = ${results[0].loserId},
		    player_b_id = ${results[1].loserId}
		WHERE category = ${match.category}
		  AND phase = 'bracket'
		  AND bracket_round = 'third_place';
	`;
}

/* ================================================================
   Stats (for admin dashboard)
   ================================================================ */

export async function getStats() {
	const { rows: playerCounts } = await sql`
		SELECT
			category,
			COUNT(*)::int AS count
		FROM players
		GROUP BY category;
	`;

	const { rows: matchCounts } = await sql`
		SELECT
			status,
			COUNT(*)::int AS count
		FROM matches
		GROUP BY status;
	`;

	return {
		players: {
			[CATEGORY_MALE]: playerCounts.find((r) => r.category === CATEGORY_MALE)?.count ?? 0,
			[CATEGORY_FEMALE]: playerCounts.find((r) => r.category === CATEGORY_FEMALE)?.count ?? 0,
		},
		matches: {
			[STATUS_PENDING]: matchCounts.find((r) => r.status === STATUS_PENDING)?.count ?? 0,
			[STATUS_PLAYED]: matchCounts.find((r) => r.status === STATUS_PLAYED)?.count ?? 0,
		},
	};
}
