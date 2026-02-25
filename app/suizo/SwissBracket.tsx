"use client";

/**
 * SwissBracket — classic Swiss bracket flowchart.
 *
 * Layout:
 *   - Each column = one round (Ronda 1 … 6)
 *   - Each box in a column = players who entered that round with a specific W-L record
 *   - Boxes size to their content — no internal scroll, no wasted empty space
 *   - Color scheme: green = winning record · yellow = even · red = losing record
 *
 * Data flow: uses already-fetched swissMatches + weeks from the page.
 * Processes matches round by round, tracking each player's cumulative record so we
 * can assign every match to the correct W-L bucket.
 */

import { useState, useMemo } from "react";
import type { Match, ScheduleWeek } from "@/lib/db";
import { determineWinner } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/* ── Layout constants ── */

const COL_W   = 164;  /* px — width of each round column                  */
const COL_GAP = 10;   /* px — horizontal gap between columns               */
const BOX_GAP = 12;   /* px — vertical gap between boxes in the same column */

/* ── Data types ── */

interface BracketMatch {
	id: number;
	playerAName: string;
	playerBName: string;
	score: string;
	playerAWon: boolean;
}

interface BracketCell {
	round: number;    /* 1-based */
	wins: number;     /* wins ENTERING this round  */
	losses: number;   /* losses ENTERING this round */
	matches: BracketMatch[];
}

/* ── Build bracket grid from raw match data ── */

function buildColumns(
	allMatches: Match[],
	weeks: ScheduleWeek[],
	category: Category,
): BracketCell[][] {
	/* Filter + map week_id → chronological round number */
	const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);
	const weekToRound = new Map(sortedWeeks.map((w, i) => [w.id, i + 1]));

	const catMatches = allMatches.filter(
		(m) => m.category === category && m.score && m.week_id != null,
	);

	/* Group matches by round */
	const byRound = new Map<number, Match[]>();
	for (const m of catMatches) {
		const r = weekToRound.get(m.week_id!);
		if (r == null) continue;
		if (!byRound.has(r)) byRound.set(r, []);
		byRound.get(r)!.push(m);
	}

	const maxRound =
		byRound.size > 0 ? Math.max(...Array.from(byRound.keys())) : 0;

	/* Track each player's cumulative record before each round */
	const playerRecord = new Map<number, { wins: number; losses: number }>();
	const getRecord = (id: number) => playerRecord.get(id) ?? { wins: 0, losses: 0 };

	/* Accumulate cells round by round */
	const cellMap = new Map<string, BracketCell>();

	for (let r = 1; r <= maxRound; r++) {
		const roundMatches = byRound.get(r) ?? [];

		/* ── Assign each match to the correct W-L bucket ── */
		for (const m of roundMatches) {
			if (!m.score) continue;

			/*
			 * In Swiss, both players should share the same record going into a match.
			 * We use player_a's record as the canonical bucket key.
			 */
			const { wins, losses } = getRecord(m.player_a_id);
			const key = `${r}|${wins}|${losses}`;

			if (!cellMap.has(key)) {
				cellMap.set(key, { round: r, wins, losses, matches: [] });
			}

			const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score);
			cellMap.get(key)!.matches.push({
				id: m.id,
				playerAName: m.player_a_name ?? "—",
				playerBName: m.player_b_name ?? "—",
				score: m.score,
				playerAWon: winnerId === m.player_a_id,
			});
		}

		/* ── Update records after all matches in this round are processed ── */
		for (const m of roundMatches) {
			if (!m.score) continue;
			const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score);
			const loserId =
				winnerId === m.player_a_id ? m.player_b_id : m.player_a_id;

			const wRec = getRecord(winnerId);
			const lRec = getRecord(loserId);
			playerRecord.set(winnerId, { wins: wRec.wins + 1, losses: wRec.losses });
			playerRecord.set(loserId, { wins: lRec.wins, losses: lRec.losses + 1 });
		}
	}

	/* Organise into columns, each column sorted with best record at the top */
	const columns: BracketCell[][] = [];
	for (let r = 1; r <= maxRound; r++) {
		const cells = Array.from(cellMap.values())
			.filter((c) => c.round === r)
			.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
		if (cells.length) columns.push(cells);
	}

	return columns;
}

/* ── Box colour scheme ── */

interface BoxStyle {
	border: string;
	headerBg: string;
	headerText: string;
	recordBadge: string;
}

function boxStyle(wins: number, losses: number): BoxStyle {
	/* Green — winning record (includes undefeated) */
	if (wins > losses)
		return {
			border: "border-emerald-500/55",
			headerBg: "bg-emerald-500/10",
			headerText: "text-emerald-300",
			recordBadge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
		};
	/* Red — losing record (includes winless) */
	if (losses > wins)
		return {
			border: "border-red-500/50",
			headerBg: "bg-red-500/10",
			headerText: "text-red-400",
			recordBadge: "bg-red-500/15 text-red-400 ring-red-500/30",
		};
	/* Yellow — even record (wins === losses, including 0-0) */
	return {
		border: "border-yellow-400/50",
		headerBg: "bg-yellow-400/10",
		headerText: "text-yellow-300",
		recordBadge: "bg-yellow-400/15 text-yellow-300 ring-yellow-400/25",
	};
}

/* ── Single record box — sizes to content, no scroll ── */

function RecordBox({ cell }: { cell: BracketCell }) {
	const style = boxStyle(cell.wins, cell.losses);

	return (
		<div
			className={`overflow-hidden rounded-lg border ${style.border} bg-[hsl(215_25%_8%/0.85)]`}
		>
			{/* Header: record label + match count */}
			<div
				className={`flex items-center justify-between px-2.5 py-1.5 ${style.headerBg}`}
			>
				<span
					className={`rounded px-1.5 py-0.5 text-[11px] font-bold ring-1 ${style.recordBadge}`}
				>
					{cell.wins}-{cell.losses}
				</span>
				<span className="text-[10px] text-muted-foreground/50">
					{cell.matches.length}P
				</span>
			</div>

			{/* Match list — no height cap, shows every match */}
			{cell.matches.map((m) => (
				<div
					key={m.id}
					className="border-b border-[hsl(215_20%_40%/0.08)] px-2 py-1"
				>
					{/* Winner */}
					<p className="truncate text-[11px] font-semibold leading-snug text-foreground">
						{m.playerAWon ? m.playerAName : m.playerBName}
					</p>
					{/* Loser */}
					<p className="truncate text-[11px] leading-snug text-muted-foreground/50">
						{m.playerAWon ? m.playerBName : m.playerAName}
					</p>
				</div>
			))}
		</div>
	);
}

/* ── Main export ── */

export default function SwissBracket({
	swissMatches,
	weeks,
}: {
	swissMatches: Match[];
	weeks: ScheduleWeek[];
}) {
	const [category, setCategory] = useState<Category>(CATEGORY_MALE);

	const columns = useMemo(
		() => buildColumns(swissMatches, weeks, category),
		[swissMatches, weeks, category],
	);

	if (columns.length === 0) {
		return (
			<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
				No hay partidos registrados todavía.
			</div>
		);
	}

	const totalW = columns.length * COL_W + (columns.length - 1) * COL_GAP;

	return (
		<div className="grid gap-4">
			{/* Category pills */}
			<div className="flex gap-2">
				{([CATEGORY_MALE, CATEGORY_FEMALE] as const).map((cat) => (
					<button
						key={cat}
						onClick={() => setCategory(cat)}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors glass-interactive ${
							category === cat
								? "bg-primary/20 text-primary ring-1 ring-primary/30"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{CATEGORY_LABELS[cat].full}
					</button>
				))}
			</div>

			{/* Bracket — horizontally scrollable on small screens */}
			<div className="glass overflow-x-auto rounded-2xl p-4">
				<div style={{ minWidth: totalW }}>
					{/* Round headers */}
					<div className="mb-2 flex" style={{ gap: COL_GAP }}>
						{columns.map((_, i) => (
							<div
								key={i}
								className="shrink-0 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
								style={{ width: COL_W }}
							>
								Ronda {i + 1}
							</div>
						))}
					</div>

					{/*
					 * Columns — each independently sized to its content.
					 * Boxes stack top-to-bottom within a column; the column with the
					 * most content drives the overall bracket height naturally.
					 * align-items: flex-start keeps shorter columns from stretching.
					 */}
					<div className="flex items-start" style={{ gap: COL_GAP }}>
						{columns.map((cells, colIdx) => (
							<div
								key={colIdx}
								className="flex shrink-0 flex-col"
								style={{ width: COL_W, gap: BOX_GAP }}
							>
								{cells.map((cell) => (
									<RecordBox
										key={`${cell.wins}-${cell.losses}`}
										cell={cell}
									/>
								))}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="h-2 w-3 rounded-sm bg-emerald-500/55" />
					Record positivo
				</span>
				<span className="flex items-center gap-1.5">
					<span className="h-2 w-3 rounded-sm bg-yellow-400/55" />
					Empatado
				</span>
				<span className="flex items-center gap-1.5">
					<span className="h-2 w-3 rounded-sm bg-red-500/55" />
					Record negativo
				</span>
				<span className="ml-auto">Ganador arriba · Perdedor abajo</span>
			</div>
		</div>
	);
}
