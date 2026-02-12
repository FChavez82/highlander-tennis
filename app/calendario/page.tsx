/**
 * /calendario — Full round-robin schedule page.
 * Shows all matches (pending and played) with status indicators.
 */
import { getMatches, type Match } from "@/lib/db";
import CalendarFilter from "./CalendarFilter";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
	/* Fetch all matches */
	const matches = await getMatches();

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold text-court-800">Calendario</h1>
			<CalendarFilter matches={matches} />
		</div>
	);
}
