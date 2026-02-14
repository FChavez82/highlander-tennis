"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/** Parsed set: each player's score for one set, plus whether it's a super-tiebreak */
type ParsedSet = { a: number; b: number; isTiebreak: boolean };

/** Parse a score string like "6-4, 3-6, [10-7]" into individual sets */
function parseSets(score: string): ParsedSet[] {
	if (!score) return [];
	return score.split(",").map((s) => {
		const trimmed = s.trim();
		const tbMatch = trimmed.match(/\[(\d+)-(\d+)\]/);
		if (tbMatch) {
			return { a: parseInt(tbMatch[1]), b: parseInt(tbMatch[2]), isTiebreak: true };
		}
		const parts = trimmed.split("-").map((n) => parseInt(n.trim()));
		if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
			return { a: parts[0], b: parts[1], isTiebreak: false };
		}
		return null;
	}).filter((s): s is ParsedSet => s !== null);
}

/** Pill base */
const pillBase =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
/** Pill active */
const pillActive =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/**
 * Results filter and display — v0 glass design.
 */
export default function ResultsFilter({ matches }: { matches: Match[] }) {
	const [filter, setFilter] = useState<"all" | Category>("all");
	const [selectedPlayer, setSelectedPlayer] = useState<string>("all");

	/* Build a sorted list of unique player names from the matches */
	const playerNames = Array.from(
		new Set(
			matches.flatMap((m) => [m.player_a_name, m.player_b_name].filter(Boolean) as string[])
		)
	).sort((a, b) => a.localeCompare(b, "es"));

	/* Apply both category and player filters */
	const filtered = matches.filter((m) => {
		const matchesCategory = filter === "all" || m.category === filter;
		const matchesPlayer =
			selectedPlayer === "all" ||
			m.player_a_name === selectedPlayer ||
			m.player_b_name === selectedPlayer;
		return matchesCategory && matchesPlayer;
	});

	return (
		<>
			{/* Filters row */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Category pills */}
				{(["all", CATEGORY_MALE, CATEGORY_FEMALE] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={filter === f ? pillActive : pillBase}
					>
						{f === "all" ? "Todos" : CATEGORY_LABELS[f].full}
					</button>
				))}

				{/* Divider */}
				<div className="hidden h-6 w-px bg-border sm:block" />

				{/* Player dropdown */}
				<select
					value={selectedPlayer}
					onChange={(e) => setSelectedPlayer(e.target.value)}
					className="rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-primary/30"
				>
					<option value="all">Todos los jugadores</option>
					{playerNames.map((name) => (
						<option key={name} value={name}>
							{name}
						</option>
					))}
				</select>
			</div>

			{/* Results */}
			{filtered.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay resultados disponibles.
				</div>
			) : (
				<div className="grid gap-3">
					{filtered.map((match) => (
						<ResultCard key={match.id} match={match} />
					))}
				</div>
			)}
		</>
	);
}

function ResultCard({ match }: { match: Match }) {
	const sets = parseSets(match.score || "");

	return (
		<div className="glass rounded-2xl p-3 transition-shadow hover:glass-glow-primary">
			{/* Top row: category badge + date */}
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<span
					className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
						match.category === CATEGORY_MALE
							? "bg-primary/15 text-primary ring-primary/25"
							: "bg-accent/15 text-accent ring-accent/25"
					}`}
				>
					{CATEGORY_LABELS[match.category].short}
				</span>
				{match.date_played && (
					<span className="text-xs text-muted-foreground">
						{new Date(match.date_played).toLocaleDateString("es-ES", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
					</span>
				)}
			</div>

			{/* Score grid: two rows (one per player), columns for each set */}
			<div className="overflow-x-auto">
			<div
				className="grid items-center gap-x-2 gap-y-1.5"
				style={{
					gridTemplateColumns: `1fr repeat(${sets.length}, auto)`,
				}}
			>
				{/* Header row */}
				<div />
				{sets.map((s, i) => (
					<div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
						{s.isTiebreak ? "S. Tie" : `Set ${i + 1}`}
					</div>
				))}

				{/* Player A row */}
				<div className="truncate text-sm font-semibold text-foreground">
					{match.player_a_name}
				</div>
				{sets.map((s, i) => (
					<div
						key={i}
						className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold ${
							s.a > s.b
								? "bg-primary/15 text-primary ring-1 ring-primary/25"
								: "bg-[hsl(210_20%_80%/0.05)] text-muted-foreground"
						}`}
					>
						{s.a}
					</div>
				))}

				{/* Player B row */}
				<div className="truncate text-sm font-semibold text-foreground">
					{match.player_b_name}
				</div>
				{sets.map((s, i) => (
					<div
						key={i}
						className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold ${
							s.b > s.a
								? "bg-primary/15 text-primary ring-1 ring-primary/25"
								: "bg-[hsl(210_20%_80%/0.05)] text-muted-foreground"
						}`}
					>
						{s.b}
					</div>
				))}
			</div>
			</div>
		</div>
	);
}
