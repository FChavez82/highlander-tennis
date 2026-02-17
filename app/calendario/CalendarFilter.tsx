"use client";

import { useState, useMemo } from "react";
import { Trophy, Clock, CheckCircle } from "lucide-react";
import type { Match } from "@/lib/db";
import {
	CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS,
	STATUS_PENDING, STATUS_PLAYED, STATUS_LABELS,
	categoryBadgeClass,
	type Category, type MatchStatus,
} from "@/lib/constants";
import { parseSets, getWinner, type ParsedSet } from "@/lib/score";
import { safeDate } from "@/lib/utils";

/* ── Shared pill styles ── */
const pillBase =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const pillActive =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

/* ── Spanish day headers (Monday-first) ── */
const DAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

/* ── Spanish month names ── */
const MONTH_NAMES = [
	"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
	"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/* ── Types ── */

/** A single cell in the calendar grid */
type CalendarCell = {
	day: number;          /* day of month (1-31) */
	dateKey: string;      /* ISO date key "YYYY-MM-DD" */
	isCurrentMonth: boolean;
};

/* ── Helpers ── */

/** Group played matches by their date_played (YYYY-MM-DD key) */
function groupMatchesByDay(matches: Match[]): Map<string, Match[]> {
	const map = new Map<string, Match[]>();
	for (const m of matches) {
		if (!m.date_played) continue;
		/* Coerce to string — Postgres driver may return a Date object */
		const raw = typeof m.date_played === "string"
			? m.date_played
			: new Date(m.date_played).toISOString();
		const key = raw.slice(0, 10);
		const arr = map.get(key);
		if (arr) {
			arr.push(m);
		} else {
			map.set(key, [m]);
		}
	}
	return map;
}

/**
 * Build an array of calendar cells for a given month.
 * Includes padding days from prev/next months so the grid always
 * starts on Monday and fills complete weeks.
 */
function buildCalendarGrid(year: number, month: number): CalendarCell[] {
	const cells: CalendarCell[] = [];

	/* First day of the month and how many days in it */
	const firstDay = new Date(year, month, 1);
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	/* getDay() returns 0=Sun … 6=Sat. Convert to Monday-first: Mon=0 … Sun=6 */
	const startDow = (firstDay.getDay() + 6) % 7;

	/* Padding from previous month */
	const prevMonthDays = new Date(year, month, 0).getDate();
	for (let i = startDow - 1; i >= 0; i--) {
		const d = prevMonthDays - i;
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
		cells.push({ day: d, dateKey, isCurrentMonth: false });
	}

	/* Current month days */
	for (let d = 1; d <= daysInMonth; d++) {
		const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
		cells.push({ day: d, dateKey, isCurrentMonth: true });
	}

	/* Padding from next month to complete the last week */
	const remainder = cells.length % 7;
	if (remainder > 0) {
		const nextMonth = month === 11 ? 0 : month + 1;
		const nextYear = month === 11 ? year + 1 : year;
		for (let d = 1; d <= 7 - remainder; d++) {
			const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			cells.push({ day: d, dateKey, isCurrentMonth: false });
		}
	}

	return cells;
}

/** Format a date key as "LUNES, 16 FEBRERO" (all caps, no "de") */
const DAY_NAMES = [
	"DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO",
];
function formatDayHeader(dateKey: string): string {
	const d = new Date(dateKey + "T12:00:00");
	const dayName = DAY_NAMES[d.getDay()];
	const dayNum = d.getDate();
	const monthName = MONTH_NAMES[d.getMonth()].toUpperCase();
	return `${dayName}, ${dayNum} ${monthName}`;
}

/** Get today's date as YYYY-MM-DD */
function todayKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export default function CalendarFilter({ matches }: { matches: Match[] }) {
	/* ── Filter state ── */
	const [catFilter, setCatFilter] = useState<"all" | Category>("all");
	const [statusFilter, setStatusFilter] = useState<"all" | MatchStatus>("all");

	/* ── Calendar navigation state ── */
	const [currentMonth, setCurrentMonth] = useState<Date>(() => {
		/* Default to the month of the most recent played match, or today */
		const played = matches
			.filter((m) => m.date_played)
			.sort((a, b) => (b.date_played! > a.date_played! ? 1 : -1));
		if (played.length > 0) {
			const d = new Date(played[0].date_played!);
			return new Date(d.getFullYear(), d.getMonth(), 1);
		}
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	/* ── Selected day for detail panel ── */
	const [selectedDay, setSelectedDay] = useState<string | null>(null);

	/* ── Apply filters ── */
	const filtered = useMemo(() => matches.filter((m) => {
		if (catFilter !== "all" && m.category !== catFilter) return false;
		if (statusFilter !== "all" && m.status !== statusFilter) return false;
		return true;
	}), [matches, catFilter, statusFilter]);

	const pending = useMemo(() => filtered.filter((m) => m.status === STATUS_PENDING), [filtered]);
	const played = useMemo(() => filtered.filter((m) => m.status === STATUS_PLAYED), [filtered]);

	/* ── Group played matches by day ── */
	const matchesByDay = useMemo(() => groupMatchesByDay(played), [played]);

	/* ── Calendar grid for the currently displayed month ── */
	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();
	const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);
	const today = todayKey();

	/* ── Matches for selected day ── */
	const selectedMatches = selectedDay ? matchesByDay.get(selectedDay) ?? [] : [];

	/* ── Month navigation handlers ── */
	function prevMonth() {
		setCurrentMonth(new Date(year, month - 1, 1));
		setSelectedDay(null);
	}
	function nextMonth() {
		setCurrentMonth(new Date(year, month + 1, 1));
		setSelectedDay(null);
	}

	return (
		<>
			{/* ── Filter pills ── */}
			<div className="flex flex-wrap gap-4">
				<div className="flex gap-2" role="group" aria-label="Filtrar por categoria">
					{(["all", CATEGORY_MALE, CATEGORY_FEMALE] as const).map((f) => (
						<button
							key={f}
							onClick={() => setCatFilter(f)}
							aria-pressed={catFilter === f}
							className={catFilter === f ? pillActive : pillBase}
						>
{f === "all" ? "Todas" : CATEGORY_LABELS[f].full}
						</button>
					))}
				</div>
				<div className="flex gap-2" role="group" aria-label="Filtrar por estado">
					{(["all", STATUS_PENDING, STATUS_PLAYED] as const).map((f) => (
						<button
							key={f}
							onClick={() => setStatusFilter(f)}
							aria-pressed={statusFilter === f}
							className={statusFilter === f ? pillActive : pillBase}
						>
							{f === STATUS_PENDING && <Clock className="h-3.5 w-3.5" />}
							{f === STATUS_PLAYED && <CheckCircle className="h-3.5 w-3.5" />}
							{f === "all" ? "Todos" : STATUS_LABELS[f].full}
						</button>
					))}
				</div>
			</div>

			{/* ── Summary ── */}
			<p className="text-sm text-muted-foreground">
				{filtered.length} partido{filtered.length !== 1 ? "s" : ""} &middot;{" "}
				{pending.length} pendiente{pending.length !== 1 ? "s" : ""} &middot;{" "}
				{played.length} jugado{played.length !== 1 ? "s" : ""}
			</p>

			{/* ── Calendar grid ── */}
			<div className="glass rounded-2xl p-4 sm:p-5">
				{/* Month navigation header */}
				<div className="mb-4 flex items-center justify-between">
					<button
						onClick={prevMonth}
						className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[hsl(210_20%_80%/0.08)] hover:text-foreground glass-interactive"
						aria-label="Mes anterior"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<h2 className="text-lg font-bold text-foreground">
						{MONTH_NAMES[month]} {year}
					</h2>
					<button
						onClick={nextMonth}
						className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[hsl(210_20%_80%/0.08)] hover:text-foreground glass-interactive"
						aria-label="Mes siguiente"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>

				{/* Day-of-week headers */}
				<div className="grid grid-cols-7 gap-1 mb-1">
					{DAY_HEADERS.map((d) => (
						<div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							{d}
						</div>
					))}
				</div>

				{/* Calendar day cells */}
				<div className="grid grid-cols-7 gap-1">
					{cells.map((cell, i) => {
						const dayMatches = matchesByDay.get(cell.dateKey) ?? [];
						const isToday = cell.dateKey === today;
						const isSelected = cell.dateKey === selectedDay;
						const hasMatches = dayMatches.length > 0;

						/* Collect which categories have matches on this day for dot colors */
						const hasMale = dayMatches.some((m) => m.category === CATEGORY_MALE);
						const hasFemale = dayMatches.some((m) => m.category === CATEGORY_FEMALE);

						return (
							<button
								key={i}
								onClick={() => {
									if (hasMatches) {
										setSelectedDay(isSelected ? null : cell.dateKey);
									}
								}}
								className={`
									relative flex flex-col items-center justify-center rounded-lg
									py-2 sm:py-2.5 min-h-[2.75rem] sm:min-h-[3rem]
									text-sm font-medium transition-all
									${!cell.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
									${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}
									${isSelected ? "bg-primary/20 text-primary ring-1 ring-primary/50" : ""}
									${hasMatches && !isSelected ? "hover:bg-[hsl(210_20%_80%/0.08)] cursor-pointer" : ""}
									${!hasMatches ? "cursor-default" : ""}
								`}
							>
								<span>{cell.day}</span>

								{/* Category color dots */}
								{hasMatches && (
									<div className="mt-0.5 flex gap-0.5">
										{hasMale && (
											<span className="h-1.5 w-1.5 rounded-full bg-cat-male" />
										)}
										{hasFemale && (
											<span className="h-1.5 w-1.5 rounded-full bg-cat-female" />
										)}
									</div>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* ── Selected day detail panel ── */}
			{selectedDay && selectedMatches.length > 0 && (
				<div className="glass rounded-2xl p-5">
					<h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
						{formatDayHeader(selectedDay)}
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
						{selectedMatches.map((match) => (
							<MatchRow key={match.id} match={match} />
						))}
					</div>
				</div>
			)}

			{/* ── Pending matches (no date_played) ── */}
			{pending.length > 0 && (
				<div className="glass rounded-2xl p-5">
					<h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
						Pendientes ({pending.length})
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
						{pending.map((match) => (
							<MatchRow key={match.id} match={match} />
						))}
					</div>
				</div>
			)}

			{/* Empty state */}
			{filtered.length === 0 && (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay partidos para mostrar.
				</div>
			)}
		</>
	);
}

/* ══════════════════════════════════════════════════════════════
   MatchRow — score card for a single match
   ══════════════════════════════════════════════════════════════ */

function MatchRow({ match }: { match: Match }) {
	const sets = match.score ? parseSets(match.score) : [];
	const winner = sets.length > 0 ? getWinner(sets) : null;

	return (
		<div className="glass-light rounded-xl p-3 transition-shadow hover:glass-glow-primary">
			{/* Top row: category badge + status badge + date */}
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span
						className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${categoryBadgeClass(match.category)}`}
					>
												{CATEGORY_LABELS[match.category].full}
					</span>
					{match.status === STATUS_PLAYED ? (
						<span className="inline-flex rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/25">
							Jugado
						</span>
					) : (
						<span className="inline-flex rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-accent/25">
							Pendiente
						</span>
					)}
				</div>
				{match.date_played && (
					<span className="text-xs text-muted-foreground">
						{safeDate(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
					</span>
				)}
			</div>

			{/* Score grid for played matches, simple "vs" row for pending */}
			{match.status === STATUS_PLAYED && sets.length > 0 ? (
				<div className="overflow-x-auto">
					<div
						className="inline-grid items-center gap-x-2 gap-y-1"
						style={{ gridTemplateColumns: `minmax(0, max-content) repeat(${sets.length}, 2.25rem)` }}
					>
						{/* Header row */}
						<div />
						{sets.map((s, i) => (
							<div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
								{s.isTiebreak ? "ST" : `S${i + 1}`}
							</div>
						))}

						{/* Player A row */}
						<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
							<span className="truncate text-sm font-semibold text-foreground">{match.player_a_name}</span>
							{winner === "a" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
						</div>
						{sets.map((s, i) => (
							<div
								key={i}
								className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-bold ${
									s.a > s.b
										? "bg-primary/15 text-primary ring-1 ring-primary/25"
										: "bg-[hsl(210_20%_80%/0.05)] text-muted-foreground"
								}`}
							>
								{s.a}
							</div>
						))}

						{/* Player B row */}
						<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
							<span className="truncate text-sm font-semibold text-foreground">{match.player_b_name}</span>
							{winner === "b" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
						</div>
						{sets.map((s, i) => (
							<div
								key={i}
								className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-bold ${
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
			) : (
				<div className="flex items-center gap-2">
					<b className="text-foreground">{match.player_a_name}</b>
					<span className="text-xs text-muted-foreground">vs</span>
					<b className="text-foreground">{match.player_b_name}</b>
				</div>
			)}
		</div>
	);
}
