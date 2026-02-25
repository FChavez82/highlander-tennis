/**
 * /calendario — Full round-robin schedule page.
 */
import type { Metadata } from "next";
import { getMatches } from "@/lib/db";
import { TOURNAMENT_NAME, REVALIDATE_SECONDS } from "@/lib/constants";
import CalendarFilter from "./CalendarFilter";

export const metadata: Metadata = {
	title: `Calendario — ${TOURNAMENT_NAME}`,
	description: "Calendario completo de partidos del torneo round-robin.",
};

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = REVALIDATE_SECONDS;

export default async function CalendarioPage() {
	const matches = await getMatches();

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Calendario</h1>
			<CalendarFilter matches={matches} />
		</div>
	);
}
