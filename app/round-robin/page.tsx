/**
 * /round-robin — Format explorer: simulated round-robin tournament.
 *
 * Fetches real player names from the DB, but all match results are
 * generated client-side from a random seed. Zero DB writes.
 * "Regenerar" picks a new seed so the draw and results change together.
 */
import type { Metadata } from "next";
import { getPlayers } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, TOURNAMENT_NAME, REVALIDATE_SECONDS } from "@/lib/constants";
import RoundRobinClient from "./RoundRobinClient";

export const metadata: Metadata = {
	title: `Round Robin — ${TOURNAMENT_NAME}`,
	description: "Explorador del formato todos-contra-todos con resultados simulados.",
};

export const revalidate = REVALIDATE_SECONDS;

export default async function RoundRobinPage() {
	const [malePlayers, femalePlayers] = await Promise.all([
		getPlayers(CATEGORY_MALE),
		getPlayers(CATEGORY_FEMALE),
	]);

	return (
		<div className="grid gap-8">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Round Robin
				</h1>
				<p className="text-sm text-muted-foreground">
					Formato todos contra todos — cada jugador enfrenta a los demás una vez.
				</p>
			</div>
			<RoundRobinClient malePlayers={malePlayers} femalePlayers={femalePlayers} />
		</div>
	);
}
