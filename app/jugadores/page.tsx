/**
 * /jugadores — Public player list with M/F tabs.
 * Shows each player's name, matches played, wins, losses, and pending.
 */
import { getPlayers, type Standing } from "@/lib/db";
import PlayerTabs from "./PlayerTabs";

export const dynamic = "force-dynamic";

export default async function JugadoresPage() {
	/* Fetch players for both categories in parallel */
	const [masculino, femenino] = await Promise.all([
		getPlayers("M"),
		getPlayers("F"),
	]);

	/* Sort by wins descending (standings) */
	const sortByWins = (a: Standing, b: Standing) => b.won - a.won || a.name.localeCompare(b.name);
	masculino.sort(sortByWins);
	femenino.sort(sortByWins);

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold text-court-800">Jugadores</h1>
			<PlayerTabs masculino={masculino} femenino={femenino} />
		</div>
	);
}
