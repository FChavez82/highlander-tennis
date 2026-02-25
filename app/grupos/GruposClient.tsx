"use client";

/**
 * GruposClient — interactive group-stage + bracket simulator.
 *
 * Groups (4 total, A–D):
 *   - Each group plays a full round-robin internally
 *   - Group card shows standings + compact match list
 *   - Group winner advances to the bracket
 *
 * Bracket:
 *   - Semi 1: Group A winner vs Group B winner
 *   - Semi 2: Group C winner vs Group D winner
 *   - 3rd place: Semi losers
 *   - Final: Semi winners
 *   - Champion highlighted
 *
 * "Regenerar sorteo" changes the seed → reshuffles draw AND all results.
 */

import { useState, useMemo } from "react";
import { Shuffle, Trophy } from "lucide-react";
import type { Standing } from "@/lib/db";
import { simulateGroups, groupLabel, type GroupResult, type BracketResult, type MatchResult } from "@/lib/formats";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/* ── Constants ── */

const NUM_GROUPS = 4;
const MIN_PLAYERS = NUM_GROUPS; /* Need at least one per group */

/* ── Color palette for the 4 groups ── */

const GROUP_STYLES = [
	{
		text: "text-primary",
		bg: "bg-primary/10",
		ring: "ring-primary/20",
		border: "border-primary/20",
		label: "text-primary",
	},
	{
		text: "text-cat-male",
		bg: "bg-cat-male/10",
		ring: "ring-cat-male/20",
		border: "border-cat-male/20",
		label: "text-cat-male",
	},
	{
		text: "text-cat-female",
		bg: "bg-cat-female/10",
		ring: "ring-cat-female/20",
		border: "border-cat-female/20",
		label: "text-cat-female",
	},
	{
		text: "text-accent",
		bg: "bg-accent/10",
		ring: "ring-accent/20",
		border: "border-accent/20",
		label: "text-accent",
	},
];

/* ── Pill styles ── */

const pillBase =
	"inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const pillActive =
	"inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

/* ── Sub-components ── */

/**
 * A single group card showing standings + match results.
 */
function GroupCard({ result, index }: { result: GroupResult; index: number }) {
	const style = GROUP_STYLES[index % GROUP_STYLES.length];

	return (
		<div className="glass rounded-2xl overflow-hidden">
			{/* Group header */}
			<div className={`px-4 py-3 ${style.bg} border-b ${style.border}`}>
				<span className={`text-xs font-bold uppercase tracking-widest ${style.text}`}>
					Grupo {groupLabel(index)}
				</span>
			</div>

			{/* Standings */}
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-[hsl(210_20%_40%/0.10)]">
						<th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							Jugador
						</th>
						<th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">G</th>
						<th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">P</th>
					</tr>
				</thead>
				<tbody>
					{result.standings.map((rec, pos) => {
						const isWinner = pos === 0;
						return (
							<tr
								key={rec.player.id}
								className={`border-b border-[hsl(210_20%_40%/0.06)] ${
									isWinner ? `${style.bg}` : ""
								}`}
							>
								<td className={`px-3 py-2 font-medium ${isWinner ? style.text : "text-foreground"}`}>
									{isWinner && <span className="mr-1 text-[10px]">▶</span>}
									{rec.player.name}
								</td>
								<td className="px-3 py-2 text-center font-bold text-primary">{rec.wins}</td>
								<td className="px-3 py-2 text-center text-destructive/80">{rec.losses}</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{/* Match list */}
			<div className="border-t border-[hsl(210_20%_40%/0.10)] px-3 py-2.5">
				<div className="grid gap-1">
					{result.matches.map((m, idx) => (
						<p key={idx} className="text-[11px] text-muted-foreground">
							<span className="font-semibold text-foreground">{m.winner.name}</span>
							{" d. "}
							<span>
								{m.winner.id === m.playerA.id ? m.playerB.name : m.playerA.name}
							</span>
							<span className="mx-1 text-muted-foreground/40">·</span>
							<span className="font-mono">{m.score}</span>
						</p>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * One bracket match card showing both players with winner highlighted.
 */
function BracketCard({ match, label }: { match: MatchResult; label: string }) {
	return (
		<div className="glass rounded-xl p-3 min-w-[13rem]">
			<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
				{label}
			</div>
			<div className="grid gap-0.5">
				{([match.playerA, match.playerB] as Standing[]).map((player) => {
					const isWinner = player.id === match.winner.id;
					return (
						<div
							key={player.id}
							className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
								isWinner ? "bg-primary/10" : ""
							}`}
						>
							<span
								className={`h-1.5 w-1.5 shrink-0 rounded-full ${
									isWinner ? "bg-primary" : "bg-transparent"
								}`}
							/>
							<span
								className={`text-sm ${
									isWinner ? "font-bold text-foreground" : "text-muted-foreground"
								}`}
							>
								{player.name}
							</span>
						</div>
					);
				})}
			</div>
			<p className="mt-1.5 font-mono text-[10px] text-muted-foreground">{match.score}</p>
		</div>
	);
}

/* ── Main component ── */

export default function GruposClient({
	malePlayers,
	femalePlayers,
}: {
	malePlayers: Standing[];
	femalePlayers: Standing[];
}) {
	const [seed, setSeed] = useState(() => Date.now());
	const [category, setCategory] = useState<Category>(CATEGORY_MALE);

	const players = category === CATEGORY_MALE ? malePlayers : femalePlayers;

	const simulation = useMemo(
		() =>
			players.length >= MIN_PLAYERS
				? simulateGroups(players, NUM_GROUPS, seed)
				: null,
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
					Regenerar sorteo
				</button>
			</div>

			{!simulation ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					Se necesitan al menos {MIN_PLAYERS} jugadores en esta categoría.
				</div>
			) : (
				<>
					{/* Group cards — 2×2 grid */}
					<section className="grid gap-3">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Fase de Grupos
						</h2>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{simulation.groups.map((group, i) => (
								<GroupCard key={i} result={group} index={i} />
							))}
						</div>
					</section>

					{/* Bracket */}
					<section className="grid gap-3">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Eliminación Directa
						</h2>
						<div className="grid gap-4">
							{/* Semis */}
							<div className="flex flex-wrap gap-4">
								<BracketCard match={simulation.bracket.semi1} label="Semifinal 1" />
								<BracketCard match={simulation.bracket.semi2} label="Semifinal 2" />
							</div>

							{/* Final + 3rd place */}
							<div className="flex flex-wrap gap-4">
								<BracketCard match={simulation.bracket.final} label="Final" />
								<BracketCard match={simulation.bracket.third} label="3er Puesto" />
							</div>

							{/* Champion banner */}
							<div className="glass rounded-2xl p-5">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30">
										<Trophy className="h-5 w-5 text-accent" />
									</div>
									<div>
										<p className="text-[10px] font-bold uppercase tracking-widest text-accent">
											Campeón
										</p>
										<p className="text-lg font-bold text-foreground">
											{simulation.bracket.champion.name}
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>
				</>
			)}
		</div>
	);
}
