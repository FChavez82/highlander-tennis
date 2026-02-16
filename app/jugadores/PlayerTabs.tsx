import Link from "next/link";
import type { Standing } from "@/lib/db";

/**
 * Player list table — pure server component.
 * Receives only the selected category's players (tab switching handled by parent + URL params).
 */
export default function PlayerTabs({
	players,
}: {
	players: Standing[];
}) {
	if (players.length === 0) {
		return (
			<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
				No hay jugadores registrados en esta categoria.
			</div>
		);
	}

	return (
		<div className="glass overflow-hidden rounded-2xl">
			<div className="overflow-x-auto">
				<table className="w-full">
					<caption className="sr-only">Lista de jugadores del torneo</caption>
					<thead>
						<tr className="border-b border-[hsl(210_20%_40%/0.12)] bg-[hsl(210_20%_80%/0.03)]">
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								#
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Jugador
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								G
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								P
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Jugados
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Pend.
							</th>
						</tr>
					</thead>
					<tbody>
						{players.map((player, i) => (
							<tr
								key={player.id}
								className="border-b border-[hsl(210_20%_40%/0.06)] transition-colors hover:bg-[hsl(210_20%_80%/0.04)]"
							>
								<td className="px-4 py-3">
									<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(210_20%_80%/0.06)] text-xs font-bold text-foreground">
										{i + 1}
									</span>
								</td>
								<td className="px-4 py-3">
									<Link
										href={`/jugadores/${player.id}`}
										className="font-semibold text-foreground transition-colors hover:text-primary"
									>
										{player.name}
									</Link>
								</td>
								<td className="px-4 py-3 text-center font-bold text-primary">
									{player.won}
								</td>
								<td className="px-4 py-3 text-center font-bold text-destructive">
									{player.lost}
								</td>
								<td className="px-4 py-3 text-center text-muted-foreground">
									{player.played}
								</td>
								<td className="px-4 py-3 text-center text-muted-foreground">
									{player.pending}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="flex gap-4 border-t border-[hsl(210_20%_40%/0.06)] px-4 py-2 text-xs text-muted-foreground">
				<span>G = Ganados</span>
				<span>P = Perdidos</span>
				<span>Pend. = Pendientes</span>
			</div>
		</div>
	);
}
