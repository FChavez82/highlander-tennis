/**
 * /admin/jugadores — Manage players (add/remove).
 * Server component that fetches players, delegates interactivity to client components.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getPlayers } from "@/lib/db";
import AdminPlayerManager from "./AdminPlayerManager";

export const dynamic = "force-dynamic";

export default async function AdminJugadoresPage() {
	noStore();
	const [masculino, femenino] = await Promise.all([
		getPlayers("M"),
		getPlayers("F"),
	]);

	return (
		<AdminPlayerManager
			initialMasculino={masculino}
			initialFemenino={femenino}
		/>
	);
}
