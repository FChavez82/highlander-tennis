/**
 * /calendario — Full round-robin schedule page.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getMatches } from "@/lib/db";
import { TOURNAMENT_NAME } from "@/lib/constants";
import CalendarFilter from "./CalendarFilter";

export const metadata: Metadata = {
	title: `Calendario — ${TOURNAMENT_NAME}`,
	description: "Calendario completo de partidos del torneo round-robin.",
};

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
	noStore();
	const matches = await getMatches();

	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">Calendario</h1>
			<CalendarFilter matches={matches} />
		</div>
	);
}
