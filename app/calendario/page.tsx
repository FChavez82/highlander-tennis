/**
 * /calendario — Full round-robin schedule page.
 */
import { getMatches } from "@/lib/db";
import CalendarFilter from "./CalendarFilter";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
	const matches = await getMatches();

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<h1 className="lg-h1">Calendario</h1>
			<CalendarFilter matches={matches} />
		</div>
	);
}
