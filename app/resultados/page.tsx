/**
 * /resultados — Public results page showing completed matches.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getMatches } from "@/lib/db";
import { STATUS_PLAYED, TOURNAMENT_NAME } from "@/lib/constants";
import ResultsFilter from "./ResultsFilter";

export const metadata: Metadata = {
	title: `Resultados — ${TOURNAMENT_NAME}`,
	description: "Resultados de los partidos completados del torneo.",
};

export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
	noStore();
	const matches = await getMatches(undefined, STATUS_PLAYED);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Resultados</h1>
			<ResultsFilter matches={matches} />
		</div>
	);
}
