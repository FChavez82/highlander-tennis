"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import type { Standing } from "@/lib/db";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	categoryBadgeClass,
	type Category,
} from "@/lib/constants";

/**
 * Standings table with M/F tabs, podium highlights, and set difference.
 * Follows the same glass-card + pill-tab pattern used in PlayerTabs.
 */
export default function StandingsTable({
	masculino,
	femenino,
}: {
	masculino: Standing[];
	femenino: Standing[];
}) {
	const [tab, setTab] = useState<Category>(CATEGORY_MALE);
	const players = tab === CATEGORY_MALE ? masculino : femenino;

	/** Pill base */
	const pillBase =
		"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
	/** Pill active */
	const pillActive =
		"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

	/**
	 * Returns extra row classes for the top-3 podium positions.
	 * Gold / Silver / Bronze accent via left border + subtle bg tint.
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
				return "";
		}
	}

	return (
		<>
			{/* Tab pills */}
			<div className="flex gap-2.5">
				<button
					onClick={() => setTab(CATEGORY_MALE)}
					className={tab === CATEGORY_MALE ? pillActive : pillBase}
				>
					{CATEGORY_LABELS[CATEGORY_MALE].full} ({masculino.length})
				</button>
				<button
					onClick={() => setTab(CATEGORY_FEMALE)}
					className={tab === CATEGORY_FEMALE ? pillActive : pillBase}
				>
					{CATEGORY_LABELS[CATEGORY_FEMALE].full} ({femenino.length})
				</button>
			</div>

			{/* Table */}
			{players.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay jugadores registrados en esta categoria.
				</div>
			) : (
				<div className="glass overflow-hidden rounded-2xl">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-[hsl(210_20%_40%/0.12)] bg-[hsl(210_20%_80%/0.03)]">
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										#
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Jugador
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Pts
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										G
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										P
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Dif
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Jugados
									</th>
								</tr>
							</thead>
							<tbody>
								{players.map((player, i) => {
									const rank = i + 1;
									const diff = player.sets_won - player.sets_lost;

									return (
										<tr
											key={player.id}
											className={`border-b border-[hsl(210_20%_40%/0.06)] transition-colors hover:bg-[hsl(210_20%_80%/0.04)] ${podiumClass(rank)}`}
										>
											{/* Rank */}
											<td className="px-4 py-3">
												{rank === 1 ? (
													<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-400">
														<Trophy className="h-4 w-4" />
													</span>
												) : (
													<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(210_20%_80%/0.06)] text-xs font-bold text-foreground">
														{rank}
													</span>
												)}
											</td>

											{/* Player name + category badge */}
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<span className="font-semibold text-foreground">
														{player.name}
													</span>
													<span
														className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ring-1 ${categoryBadgeClass(player.category)}`}
													>
														{CATEGORY_LABELS[player.category].short}
													</span>
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
					</div>
				</div>
			)}
		</>
	);
}
