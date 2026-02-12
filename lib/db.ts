/**
 * Database helper — all SQL queries for the tournament live here.
 *
 * Uses @vercel/postgres which reads POSTGRES_URL from env automatically.
 */
import { sql } from "@vercel/postgres";

/* ================================================================
   Types
   ================================================================ */

export interface Player {
	id: number;
	name: string;
	category: "M" | "F";
	created_at: string;
}

export interface Match {
	id: number;
	player_a_id: number;
	player_b_id: number;
	category: "M" | "F";
	status: "pendiente" | "jugado";
	score: string | null;
	date_played: string | null;
	created_at: string;
	/* Joined fields (populated by some queries) */
	player_a_name?: string;
	player_b_name?: string;
}

export interface Standing {
	id: number;
	name: string;
	category: "M" | "F";
	played: number;
	won: number;
	lost: number;
	pending: number;
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
	/* Fetch all completed matches to compute wins/losses */
	const { rows: matches } = await sql`
		SELECT id, player_a_id, player_b_id, score
		FROM matches
		WHERE status = 'jugado' AND score IS NOT NULL;
	`;

	/* Build a map: playerId → { won, lost } */
	const record: Record<number, { won: number; lost: number }> = {};
	for (const m of matches) {
		const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score);
		const loserId = winnerId === m.player_a_id ? m.player_b_id : m.player_a_id;

		if (!record[winnerId]) record[winnerId] = { won: 0, lost: 0 };
		if (!record[loserId]) record[loserId] = { won: 0, lost: 0 };

		record[winnerId].won++;
		record[loserId].lost++;
	}

	return standings.map((s) => ({
		...s,
		won: record[s.id]?.won ?? 0,
		lost: record[s.id]?.lost ?? 0,
	}));
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
function determineWinner(
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
	category: "M" | "F"
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
 * Get matches with player names joined, optionally filtered.
 */
export async function getMatches(
	category?: string,
	status?: string
): Promise<Match[]> {
	/* Build WHERE conditions dynamically */
	if (category && status) {
		const { rows } = await sql`
			SELECT
				m.*,
				pa.name AS player_a_name,
				pb.name AS player_b_name
			FROM matches m
			JOIN players pa ON pa.id = m.player_a_id
			JOIN players pb ON pb.id = m.player_b_id
			WHERE m.category = ${category} AND m.status = ${status}
			ORDER BY m.date_played DESC NULLS LAST, m.id;
		`;
		return rows as Match[];
	}

	if (category) {
		const { rows } = await sql`
			SELECT
				m.*,
				pa.name AS player_a_name,
				pb.name AS player_b_name
			FROM matches m
			JOIN players pa ON pa.id = m.player_a_id
			JOIN players pb ON pb.id = m.player_b_id
			WHERE m.category = ${category}
			ORDER BY m.date_played DESC NULLS LAST, m.id;
		`;
		return rows as Match[];
	}

	if (status) {
		const { rows } = await sql`
			SELECT
				m.*,
				pa.name AS player_a_name,
				pb.name AS player_b_name
			FROM matches m
			JOIN players pa ON pa.id = m.player_a_id
			JOIN players pb ON pb.id = m.player_b_id
			WHERE m.status = ${status}
			ORDER BY m.date_played DESC NULLS LAST, m.id;
		`;
		return rows as Match[];
	}

	const { rows } = await sql`
		SELECT
			m.*,
			pa.name AS player_a_name,
			pb.name AS player_b_name
		FROM matches m
		JOIN players pa ON pa.id = m.player_a_id
		JOIN players pb ON pb.id = m.player_b_id
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
export async function generateRoundRobin(category: "M" | "F"): Promise<number> {
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
			M: playerCounts.find((r) => r.category === "M")?.count ?? 0,
			F: playerCounts.find((r) => r.category === "F")?.count ?? 0,
		},
		matches: {
			pendiente: matchCounts.find((r) => r.status === "pendiente")?.count ?? 0,
			jugado: matchCounts.find((r) => r.status === "jugado")?.count ?? 0,
		},
	};
}
