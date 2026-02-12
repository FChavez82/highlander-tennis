/**
 * /resultados — Public results page showing completed matches.
 */
import { getMatches } from "@/lib/db";
import ResultsFilter from "./ResultsFilter";

export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
	const matches = await getMatches(undefined, "jugado");

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<h1 className="lg-h1">Resultados</h1>
			<ResultsFilter matches={matches} />
		</div>
	);
}
