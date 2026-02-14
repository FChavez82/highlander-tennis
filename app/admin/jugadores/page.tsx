/**
 * /admin/jugadores — Manage players (add/remove).
 * Server component that fetches players, delegates interactivity to client components.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getPlayers } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE } from "@/lib/constants";
import AdminPlayerManager from "./AdminPlayerManager";

export const dynamic = "force-dynamic";

export default async function AdminJugadoresPage() {
	noStore();
	const [masculino, femenino] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	return (
		<AdminPlayerManager
			initialMasculino={masculino}
			initialFemenino={femenino}
		/>
	);
}
