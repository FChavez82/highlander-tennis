/**
 * /suizo — Swiss tournament live tracker.
 *
 * Shows real match results and standings from the DB, grouped by round
 * (each schedule week = one Swiss round). Reuses ResultsFilter so the
 * display logic stays in one place.
 */
import type { Metadata } from "next";
import { getMatches, getScheduleWeeks } from "@/lib/db";
import { STATUS_PLAYED, PHASE_ROUND_ROBIN, PHASE_BRACKET, TOURNAMENT_NAME, REVALIDATE_SECONDS } from "@/lib/constants";
import ResultsFilter from "@/app/resultados/ResultsFilter";
import SwissBracket from "./SwissBracket";

export const metadata: Metadata = {
	title: `Sistema Suizo — ${TOURNAMENT_NAME}`,
	description: "Resultados y posiciones del torneo en sistema suizo.",
};

export const revalidate = REVALIDATE_SECONDS;

export default async function SuizoPage() {
	const [swissMatches, bracketMatches, weeks] = await Promise.all([
		getMatches(undefined, STATUS_PLAYED, PHASE_ROUND_ROBIN),
		getMatches(undefined, undefined, PHASE_BRACKET),
		getScheduleWeeks(),
	]);

	return (
		<div className="grid gap-8">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Sistema Suizo
				</h1>
				<p className="text-sm text-muted-foreground">
					Progreso y resultados por ronda.
				</p>
			</div>

			{/* Swiss bracket — columns per round, boxes per W-L record */}
			<section className="grid gap-3">
				<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Cuadro de Progreso
				</h2>
				<SwissBracket swissMatches={swissMatches} weeks={weeks} />
			</section>

			{/* Round-by-round results */}
			<section className="grid gap-3">
				<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Resultados por Ronda
				</h2>
				<ResultsFilter
					swissMatches={swissMatches}
					bracketMatches={bracketMatches}
					weeks={weeks}
				/>
			</section>
		</div>
	);
}
