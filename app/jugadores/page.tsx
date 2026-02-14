/**
 * /jugadores — Public player list with M/F tabs.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getPlayers, type Standing } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME } from "@/lib/constants";
import PlayerTabs from "./PlayerTabs";

export const metadata: Metadata = {
	title: `Jugadores — ${TOURNAMENT_NAME}`,
	description: "Tabla de posiciones y estadísticas de los jugadores.",
};

export const dynamic = "force-dynamic";

export default async function JugadoresPage() {
	noStore();
	const [masculino, femenino] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	/* Sort by wins descending */
	const sortByWins = (a: Standing, b: Standing) => b.won - a.won || a.name.localeCompare(b.name);
	masculino.sort(sortByWins);
	femenino.sort(sortByWins);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Jugadores</h1>
			<PlayerTabs masculino={masculino} femenino={femenino} />
		</div>
	);
}
