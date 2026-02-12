/**
 * /admin/resultados — Manage match results.
 * Lists pending matches to enter results, and completed matches to edit/delete.
 */
import { getMatches } from "@/lib/db";
import AdminResultsManager from "./AdminResultsManager";

export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
	const [pending, played] = await Promise.all([
		getMatches(undefined, "pendiente"),
		getMatches(undefined, "jugado"),
	]);

	return (
		<AdminResultsManager
			initialPending={pending}
			initialPlayed={played}
		/>
	);
}
