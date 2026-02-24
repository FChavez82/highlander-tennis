import Link from "next/link";
import { Trophy, Flame } from "lucide-react";
import type { Standing } from "@/lib/db";
import {
	CATEGORY_MALE,
	CATEGORY_LABELS,
	BRACKET_QUALIFIERS,
	categoryBadgeClass,
} from "@/lib/constants";

/**
 * Standings table — now a pure server component.
 * Receives only the selected category's players (tab switching handled by parent + URL params).
 */

/**
 * Returns extra row classes for podium + qualifier positions.
 * Gold / Silver / Bronze accent for top 3; green tint for remaining qualifiers.
 */
function podiumClass(rank: number): string {
	switch (rank) {
		case 1:
			return "border-l-2 border-l-yellow-400/70 bg-yellow-400/[0.04]";
		case 2:
			return "border-l-2 border-l-gray-300/60 bg-gray-300/[0.03]";
		case 3:
			return "border-l-2 border-l-amber-600/50 bg-amber-600/[0.03]";
		default:
			if (rank <= BRACKET_QUALIFIERS) {
				return "border-l-2 border-l-emerald-400/50 bg-emerald-400/[0.03]";
			}
			return "";
	}
}

export default function StandingsTable({
	players,
	streaks = {},
}: {
	players: Standing[];
	streaks?: Record<number, number>;
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
					<caption className="sr-only">Tabla de clasificacion del torneo</caption>
					<thead>
						<tr className="border-b border-[hsl(210_20%_40%/0.12)] bg-[hsl(210_20%_80%/0.03)]">
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								#
							</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Jugador
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Pts
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								G
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								P
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Dif
							</th>
							<th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Jugados
							</th>
						</tr>
					</thead>
					<tbody>
						{players.map((player, i) => {
							const rank = i + 1;
							const diff = player.sets_won - player.sets_lost;
							const streak = streaks[player.id] ?? 0;
							const separatorClass =
								rank === BRACKET_QUALIFIERS
									? "border-b-2 border-b-emerald-400/30"
									: "border-b border-[hsl(210_20%_40%/0.06)]";

							return (
								<tr
									key={player.id}
									className={`${separatorClass} transition-colors hover:bg-[hsl(210_20%_80%/0.04)] ${podiumClass(rank)}`}
								>
									{/* Rank + win streak flame */}
									<td className="px-4 py-3">
										<div className="flex items-center gap-1.5">
											{rank === 1 ? (
												<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-400">
													<Trophy className="h-4 w-4" />
												</span>
											) : (
												<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(210_20%_80%/0.06)] text-xs font-bold text-foreground">
													{rank}
												</span>
											)}
											{streak >= 3 && (
												<span className="inline-flex items-center gap-0.5 text-accent" title={`Racha de ${streak} victorias`}>
													<Flame className="h-4 w-4" />
													<span className="text-[10px] font-bold">{streak}</span>
												</span>
											)}
										</div>
									</td>

									{/* Player name + category badge + qualifier badge */}
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<Link
												href={`/jugadores/${player.id}`}
												className="font-semibold text-foreground transition-colors hover:text-primary"
											>
												{player.name}
											</Link>
											<span
												className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ring-1 ${categoryBadgeClass(player.category)}`}
											>
																							{CATEGORY_LABELS[player.category].full}
											</span>
											{rank <= BRACKET_QUALIFIERS && (
												<span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase leading-none text-emerald-400 ring-1 ring-emerald-500/25">
													Clasificado
												</span>
											)}
										</div>
									</td>

									{/* Points (1 per win) */}
									<td className="px-4 py-3 text-center font-bold text-primary">
										{player.won}
									</td>

									{/* Wins */}
									<td className="px-4 py-3 text-center font-bold text-primary/70">
										{player.won}
									</td>

									{/* Losses */}
									<td className="px-4 py-3 text-center font-bold text-destructive/70">
										{player.lost}
									</td>

									{/* Set difference */}
									<td className="px-4 py-3 text-center font-mono text-sm text-muted-foreground">
										{diff > 0 ? `+${diff}` : diff}
									</td>

									{/* Matches played */}
									<td className="px-4 py-3 text-center text-muted-foreground">
										{player.played}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-4 border-t border-[hsl(210_20%_40%/0.06)] px-4 py-2 text-xs text-muted-foreground">
				<span>Pts = Puntos (1 por victoria)</span>
				<span>G = Ganados</span>
				<span>P = Perdidos</span>
				<span>Dif = Diferencia de sets</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60" />
					Top {BRACKET_QUALIFIERS} clasifican a la Fase Final
				</span>
			</div>
		</div>
	);
}
