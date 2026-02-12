/**
 * /resultados — Public results page showing completed matches.
 * Filterable by category with a visual card layout.
 */
import { getMatches, type Match } from "@/lib/db";
import ResultsFilter from "./ResultsFilter";

export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
	/* Fetch all completed matches */
	const matches = await getMatches(undefined, "jugado");

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold text-court-800">Resultados</h1>
			<ResultsFilter matches={matches} />
		</div>
	);
}
