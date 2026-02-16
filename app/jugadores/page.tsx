/**
 * /jugadores — Public player list with M/F tabs.
 * Tab switching uses URL search params (?cat=M / ?cat=F) for deep-linking.
 */
import type { Metadata } from "next";
import { getPlayers, type Standing } from "@/lib/db";
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

	const [masculino, femenino] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	/* Sort by wins descending */
	const sortByWins = (a: Standing, b: Standing) => b.won - a.won || a.name.localeCompare(b.name);
	masculino.sort(sortByWins);
	femenino.sort(sortByWins);

	/* Pick the selected category's data */
	const players = cat === CATEGORY_MALE ? masculino : femenino;

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Jugadores</h1>
			<CategoryTabs
				maleCount={masculino.length}
				femaleCount={femenino.length}
			/>
			<PlayerTabs players={players} />
		</div>
	);
}
