/**
 * /clasificacion — Public standings page with rankings, points, and set difference.
 *
 * Sort order: points (wins) desc → set difference desc → name asc.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getPlayers, sortStandings } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME } from "@/lib/constants";
import StandingsTable from "./StandingsTable";

export const metadata: Metadata = {
	title: `Clasificacion — ${TOURNAMENT_NAME}`,
	description: "Clasificacion oficial del torneo con puntos y diferencia de sets.",
};

export const dynamic = "force-dynamic";

export default async function ClasificacionPage() {
	noStore();
	const [masculino, femenino] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	masculino.sort(sortStandings);
	femenino.sort(sortStandings);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
				Clasificacion
			</h1>
			<StandingsTable masculino={masculino} femenino={femenino} />
		</div>
	);
}
