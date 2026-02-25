/**
 * /clasificacion — Public standings page with rankings, points, and set difference.
 *
 * Sort order: points (wins) desc → set difference desc → name asc.
 */
import type { Metadata } from "next";
import { getPlayersWithMatches, getPlayerCounts, sortStandings, type Match } from "@/lib/db";
import { determineWinner } from "@/lib/score";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME, type Category } from "@/lib/constants";
import CategoryTabs from "@/app/components/CategoryTabs";
import StandingsTable from "./StandingsTable";

export const metadata: Metadata = {
	title: `Clasificacion — ${TOURNAMENT_NAME}`,
	description: "Clasificacion oficial del torneo con puntos y diferencia de sets.",
};

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = 60;

/**
 * Compute current win streaks for all players from played matches.
 * For each player, counts consecutive wins starting from their most recent match.
 * Returns a map of playerId → streak count (only includes streaks >= 1).
 */
function computeStreaks(matches: Match[]): Record<number, number> {
	/* Group matches by player, sorted by date_played descending */
	const playerMatches = new Map<number, Match[]>();

	for (const m of matches) {
		if (!m.score) continue;
		for (const pid of [m.player_a_id, m.player_b_id]) {
			if (!playerMatches.has(pid)) playerMatches.set(pid, []);
			playerMatches.get(pid)!.push(m);
		}
	}

	const streaks: Record<number, number> = {};

	for (const [playerId, pMatches] of Array.from(playerMatches.entries())) {
		/* Sort by date descending (most recent first) */
		pMatches.sort((a, b) => {
			const da = a.date_played ? new Date(a.date_played).getTime() : 0;
			const db = b.date_played ? new Date(b.date_played).getTime() : 0;
			return db - da;
		});

		/* Count consecutive wins from the most recent match */
		let streak = 0;
		for (const m of pMatches) {
			const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score!);
			if (winnerId === playerId) {
				streak++;
			} else {
				break;
			}
		}
		if (streak > 0) streaks[playerId] = streak;
	}

	return streaks;
}

export default async function ClasificacionPage({
	searchParams,
}: {
	searchParams: { cat?: string };
}) {
	/* Determine selected category from URL — defaults to Male */
	const cat: Category =
		searchParams.cat === CATEGORY_FEMALE ? CATEGORY_FEMALE : CATEGORY_MALE;

	/* Fetch counts (cheap) for tab labels + full standings only for the selected category */
	const [counts, result] = await Promise.all([
		getPlayerCounts(),
		getPlayersWithMatches(cat),
	]);

	const players = result.standings;
	players.sort(sortStandings);

	/* Compute streaks for the selected category's matches */
	const streaks = computeStreaks(result.matches);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
				Clasificacion
			</h1>
			<CategoryTabs
				maleCount={counts.male}
				femaleCount={counts.female}
			/>
			<StandingsTable players={players} streaks={streaks} />
		</div>
	);
}
