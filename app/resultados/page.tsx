/**
 * /resultados — Public results page showing completed matches.
 * Shows Fase 1 (Round Robin) and Fase 2 (Elimination Brackets) via tabs.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getMatches } from "@/lib/db";
import { STATUS_PLAYED, PHASE_ROUND_ROBIN, PHASE_BRACKET, TOURNAMENT_NAME } from "@/lib/constants";
import ResultsFilter from "./ResultsFilter";

export const metadata: Metadata = {
	title: `Resultados — ${TOURNAMENT_NAME}`,
	description: "Resultados de los partidos completados del torneo.",
};

export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
	noStore();

	/* Fetch round-robin played matches and ALL bracket matches (played + pending) */
	const [roundRobinMatches, bracketMatches] = await Promise.all([
		getMatches(undefined, STATUS_PLAYED, PHASE_ROUND_ROBIN),
		getMatches(undefined, undefined, PHASE_BRACKET),
	]);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Resultados</h1>
			<ResultsFilter
				roundRobinMatches={roundRobinMatches}
				bracketMatches={bracketMatches}
			/>
		</div>
	);
}
