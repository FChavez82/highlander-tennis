"use client";

/**
 * RoundRobinClient — interactive round-robin simulator.
 *
 * Receives real player names from the server, simulates all N*(N-1)/2
 * matches client-side using a seeded RNG. "Regenerar" picks a new seed
 * so both the draw and results change without any DB interaction.
 *
 * Matrix:
 *   - Row = player, Column = opponent
 *   - Upper triangle (i < j): teal dot = row player won, red dot = row player lost
 *   - Lower triangle (i > j): same result shown dimmed (mirror of upper)
 *   - Diagonal: "—"
 *   - Hover tooltip: "Winner d. Loser · score"
 *
 * Standings table below matrix sorted by wins → set diff → name.
 */

import { useState, useMemo } from "react";
import { Shuffle } from "lucide-react";
import type { Standing } from "@/lib/db";
import { simulateRoundRobin } from "@/lib/formats";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/* ── Pill styles — same pattern as other components ── */

const pillBase =
	"inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const pillActive =
	"inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

/* ── Helpers ── */

/** "Juan García Morales" → "JGM" (max 3 initials) */
function abbrev(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0]?.toUpperCase() ?? "")
		.join("")
		.slice(0, 3);
}

/** Same key formula as the internal pairKey in formats.ts */
function pairKey(idA: number, idB: number): string {
	return `${Math.min(idA, idB)}-${Math.max(idA, idB)}`;
}

/* ── Component ── */

export default function RoundRobinClient({
	malePlayers,
	femalePlayers,
}: {
	malePlayers: Standing[];
	femalePlayers: Standing[];
}) {
	const [seed, setSeed] = useState(() => Date.now());
	const [category, setCategory] = useState<Category>(CATEGORY_MALE);

	const players = category === CATEGORY_MALE ? malePlayers : femalePlayers;

	const { results, standings } = useMemo(
		() => simulateRoundRobin(players, seed),
		[players, seed],
	);

	return (
		<div className="grid gap-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex gap-2">
					{([CATEGORY_MALE, CATEGORY_FEMALE] as Category[]).map((cat) => (
						<button
							key={cat}
							onClick={() => setCategory(cat)}
							className={category === cat ? pillActive : pillBase}
						>
							{CATEGORY_LABELS[cat].full}
						</button>
					))}
				</div>
				<button
					onClick={() => setSeed(Date.now())}
					className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground transition-colors glass-interactive hover:text-foreground"
				>
					<Shuffle className="h-3.5 w-3.5" />
					Regenerar resultados
				</button>
			</div>

			{players.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay jugadores en esta categoría.
				</div>
			) : (
				<>
					{/* Results matrix */}
					<section className="grid gap-3">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Matriz de Resultados
						</h2>
						<div className="glass overflow-x-auto rounded-2xl">
							<table className="border-collapse">
								<thead>
									<tr>
										{/* Empty corner above player name column */}
										<th className="sticky left-0 z-10 min-w-[9rem] bg-[hsl(210_20%_12%)] px-3 py-2.5" />
										{players.map((p) => (
											<th
												key={p.id}
												className="w-8 px-1 py-2.5 text-center font-mono text-[10px] font-bold text-muted-foreground"
												title={p.name}
											>
												{abbrev(p.name)}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{players.map((rowPlayer, i) => (
										<tr
											key={rowPlayer.id}
											className="border-t border-[hsl(210_20%_40%/0.08)] transition-colors hover:bg-[hsl(210_20%_80%/0.03)]"
										>
											{/* Sticky row label */}
											<td className="sticky left-0 z-10 min-w-[9rem] bg-[hsl(210_20%_12%)] px-3 py-2 text-sm font-medium text-foreground">
												{rowPlayer.name}
											</td>

											{players.map((colPlayer, j) => {
												/* Diagonal */
												if (i === j) {
													return (
														<td
															key={colPlayer.id}
															className="w-8 px-1 py-2 text-center text-[10px] text-muted-foreground/25"
														>
															—
														</td>
													);
												}

												const result = results.get(pairKey(rowPlayer.id, colPlayer.id));
												if (!result) return <td key={colPlayer.id} className="w-8" />;

												const rowWon = result.winner.id === rowPlayer.id;
												const loserName = rowWon ? result.playerB.name : result.playerA.name;
												const tooltip = `${result.winner.name} d. ${loserName} · ${result.score}`;
												/* Lower triangle (mirror) is dimmed */
												const isLower = i > j;

												return (
													<td
														key={colPlayer.id}
														className={`w-8 px-1 py-2 text-center transition-opacity ${isLower ? "opacity-30" : ""}`}
														title={tooltip}
													>
														<span
															className={`text-sm leading-none ${
																rowWon ? "text-primary" : "text-destructive"
															}`}
														>
															●
														</span>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					{/* Standings table */}
					<section className="grid gap-3">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Clasificación
						</h2>
						<div className="glass overflow-hidden rounded-2xl">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-[hsl(210_20%_40%/0.12)] bg-[hsl(210_20%_80%/0.03)]">
											{["#", "Jugador", "G", "P", "SG", "SP", "+/-"].map((h, idx) => (
												<th
													key={h}
													className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
														idx < 2 ? "text-left" : "text-center"
													}`}
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{standings.map((rec, idx) => {
											const diff = rec.setsWon - rec.setsLost;
											return (
												<tr
													key={rec.player.id}
													className="border-b border-[hsl(210_20%_40%/0.06)] transition-colors hover:bg-[hsl(210_20%_80%/0.04)]"
												>
													<td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
													<td className="px-4 py-2.5 font-medium text-foreground">
														{rec.player.name}
													</td>
													<td className="px-4 py-2.5 text-center font-bold text-primary">
														{rec.wins}
													</td>
													<td className="px-4 py-2.5 text-center text-destructive/80">
														{rec.losses}
													</td>
													<td className="px-4 py-2.5 text-center text-muted-foreground">
														{rec.setsWon}
													</td>
													<td className="px-4 py-2.5 text-center text-muted-foreground">
														{rec.setsLost}
													</td>
													<td
														className={`px-4 py-2.5 text-center font-semibold ${
															diff > 0
																? "text-primary"
																: diff < 0
																	? "text-destructive/80"
																	: "text-muted-foreground"
														}`}
													>
														{diff > 0 ? `+${diff}` : String(diff)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</section>
				</>
			)}
		</div>
	);
}
