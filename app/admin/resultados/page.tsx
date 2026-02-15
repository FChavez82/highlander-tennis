/**
 * /admin/resultados — Manage match results.
 * Lists pending matches to enter results, and completed matches to edit/delete.
 * Supports both Phase 1 (Round Robin) and Phase 2 (Bracket) management.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getMatches } from "@/lib/db";
import { STATUS_PENDING, STATUS_PLAYED, PHASE_ROUND_ROBIN, PHASE_BRACKET } from "@/lib/constants";
import AdminResultsManager from "./AdminResultsManager";

export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
	noStore();
	const [pending, played, bracketMatches] = await Promise.all([
		getMatches(undefined, STATUS_PENDING, PHASE_ROUND_ROBIN),
		getMatches(undefined, STATUS_PLAYED, PHASE_ROUND_ROBIN),
		getMatches(undefined, undefined, PHASE_BRACKET),
	]);

	return (
		<AdminResultsManager
			initialPending={pending}
			initialPlayed={played}
			initialBracketMatches={bracketMatches}
		/>
	);
}
