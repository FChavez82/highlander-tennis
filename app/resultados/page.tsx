/**
 * /resultados — Public results page showing completed matches.
 *
 * Swiss format: matches are grouped by schedule week (= Swiss round).
 * Each round shows match results + cumulative standings for the category.
 * Phase 2 (bracket) tab appears once bracket matches exist in the DB.
 */
import type { Metadata } from "next";
import { getMatches, getScheduleWeeks } from "@/lib/db";
import { STATUS_PLAYED, PHASE_ROUND_ROBIN, PHASE_BRACKET, TOURNAMENT_NAME } from "@/lib/constants";
import ResultsFilter from "./ResultsFilter";

export const metadata: Metadata = {
	title: `Resultados — ${TOURNAMENT_NAME}`,
	description: "Resultados de los partidos completados del torneo.",
};

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = 60;

export default async function ResultadosPage() {

	/* Fetch Swiss (round_robin phase) played matches, bracket matches, and week list */
	const [swissMatches, bracketMatches, weeks] = await Promise.all([
		getMatches(undefined, STATUS_PLAYED, PHASE_ROUND_ROBIN),
		getMatches(undefined, undefined, PHASE_BRACKET),
		getScheduleWeeks(),
	]);

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Resultados</h1>
			<ResultsFilter
				swissMatches={swissMatches}
				bracketMatches={bracketMatches}
				weeks={weeks}
			/>
		</div>
	);
}
