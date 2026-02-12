/**
 * /jugadores — Public player list with M/F tabs.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getPlayers, type Standing } from "@/lib/db";
import PlayerTabs from "./PlayerTabs";

export const dynamic = "force-dynamic";

export default async function JugadoresPage() {
	noStore();
	const [masculino, femenino] = await Promise.all([
		getPlayers("M"),
		getPlayers("F"),
	]);

	/* Sort by wins descending */
	const sortByWins = (a: Standing, b: Standing) => b.won - a.won || a.name.localeCompare(b.name);
	masculino.sort(sortByWins);
	femenino.sort(sortByWins);

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<h1 className="lg-h1">Jugadores</h1>
			<PlayerTabs masculino={masculino} femenino={femenino} />
		</div>
	);
}
