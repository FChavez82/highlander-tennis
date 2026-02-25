/**
 * /jugadores — Public player list with M/F tabs.
 * Tab switching uses URL search params (?cat=M / ?cat=F) for deep-linking.
 */
import type { Metadata } from "next";
import { getPlayers, getPlayerCounts, type Standing } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME, type Category } from "@/lib/constants";
import CategoryTabs from "@/app/components/CategoryTabs";
import PlayerTabs from "./PlayerTabs";

export const metadata: Metadata = {
	title: `Jugadores — ${TOURNAMENT_NAME}`,
	description: "Tabla de posiciones y estadísticas de los jugadores.",
};

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = 60;

export default async function JugadoresPage({
	searchParams,
}: {
	searchParams: { cat?: string };
}) {
	/* Determine selected category from URL — defaults to Male */
	const cat: Category =
		searchParams.cat === CATEGORY_FEMALE ? CATEGORY_FEMALE : CATEGORY_MALE;

	/* Fetch counts (cheap) for tab labels + full player list only for the selected category */
	const [counts, players] = await Promise.all([
		getPlayerCounts(),
		getPlayers(cat),
	]);

	/* Sort by wins descending */
	const sortByWins = (a: Standing, b: Standing) => b.won - a.won || a.name.localeCompare(b.name);
	players.sort(sortByWins);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Jugadores</h1>
			<CategoryTabs
				maleCount={counts.male}
				femaleCount={counts.female}
			/>
			<PlayerTabs players={players} />
		</div>
	);
}
