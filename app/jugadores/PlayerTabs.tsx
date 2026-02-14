"use client";

import { useState } from "react";
import type { Standing } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/**
 * Standings table with M/F tabs — v0 glass design.
 */
export default function PlayerTabs({
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

			{/* Standings table */}
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
										G
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										P
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Jugados
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
										<td className="px-4 py-3 font-semibold text-foreground">
											{player.name}
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
			)}
		</>
	);
}
