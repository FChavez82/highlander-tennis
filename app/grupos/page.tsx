/**
 * /grupos — Format explorer: simulated group-stage tournament.
 *
 * Fetches real player names from the DB, then simulates:
 *   - 4 groups (A–D) via internal round-robins
 *   - Knockout bracket: semi-finals → 3rd place + final
 *
 * All results are client-side from a random seed. Zero DB writes.
 */
import type { Metadata } from "next";
import { getPlayers } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME, REVALIDATE_SECONDS } from "@/lib/constants";
import GruposClient from "./GruposClient";

export const metadata: Metadata = {
	title: `Grupos — ${TOURNAMENT_NAME}`,
	description: "Explorador del formato por grupos con fase eliminatoria simulada.",
};

export const revalidate = REVALIDATE_SECONDS;

export default async function GruposPage() {
	const [malePlayers, femalePlayers] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	return (
		<div className="grid gap-8">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Grupos
				</h1>
				<p className="text-sm text-muted-foreground">
					Fase de grupos con round-robin interno, seguida de eliminación directa.
				</p>
			</div>
			<GruposClient malePlayers={malePlayers} femalePlayers={femalePlayers} />
		</div>
	);
}
