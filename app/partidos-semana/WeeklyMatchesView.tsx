"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Coffee, StarIcon } from "lucide-react";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	categoryBadgeClass,
	STATUS_PENDING,
	STATUS_PLAYED,
	STATUS_CANCELLED,
	WEEK_STATUS_LABELS,
	type Category,
} from "@/lib/constants";

import type { PublicWeekData } from "./page";

/* ── Date formatting ───────────────────────────────────────────── */
/** Normalize a Postgres date (may be Date object or string) to a safe Date */
function safeDate(d: string | Date): Date {
	if (d instanceof Date) return d;
	return new Date(d + "T12:00:00");
}

function formatDateRange(start: string | Date, end: string | Date): string {
	const s = safeDate(start);
	const e = safeDate(end);
	const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
	return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", opts)}`;
}

/* ── Category pill styles (same as other public pages) ─────────── */
const pillBase =
	"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground glass-interactive";
const pillActive =
	"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

export default function WeeklyMatchesView({
	weeks,
}: {
	weeks: PublicWeekData[];
}) {
	/* Default to the first week (most recent published), or null if empty */
	const [selectedWeekId, setSelectedWeekId] = useState<number | null>(
		weeks.length > 0 ? weeks[weeks.length - 1].id : null
	);
	const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORY_MALE);

	const selectedWeek = weeks.find((w) => w.id === selectedWeekId) ?? null;

	/* Filter matches by selected category */
	const filteredMatches = selectedWeek
		? selectedWeek.matches.filter((m) => m.category === selectedCategory)
		: [];

	/* Find players who are available but have no match (byes) */
	const matchedIds = new Set(
		(selectedWeek?.matches ?? [])
			.filter((m) => m.category === selectedCategory)
			.flatMap((m) => [m.player_a_id, m.player_b_id])
	);
	const byePlayers = (selectedWeek?.availability ?? []).filter(
		(a) =>
			a.player_category === selectedCategory &&
			a.available &&
			!matchedIds.has(a.player_id)
	);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
				Partidos de la Semana
			</h1>

			{/* Empty state */}
			{weeks.length === 0 && (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					<Calendar className="mx-auto mb-3 h-8 w-8 opacity-50" />
					<p>No hay semanas publicadas aun.</p>
					<p className="mt-1 text-sm">
						Los partidos apareceran aqui cuando el administrador publique el calendario.
					</p>
				</div>
			)}

			{weeks.length > 0 && (
				<>
					{/* Week selector tabs */}
					<div className="flex flex-wrap gap-2">
						{weeks.map((week) => (
							<button
								key={week.id}
								onClick={() => setSelectedWeekId(week.id)}
								className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors glass-interactive ${
									selectedWeekId === week.id
										? "bg-primary/20 text-primary ring-1 ring-primary/30"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Calendar className="h-3.5 w-3.5" />
								Semana {week.week_number}: {formatDateRange(week.start_date, week.end_date)}
							</button>
						))}
					</div>

					{/* Category filter */}
					<div className="flex gap-2">
						{([CATEGORY_MALE, CATEGORY_FEMALE] as Category[]).map((cat) => (
							<button
								key={cat}
								onClick={() => setSelectedCategory(cat)}
								className={selectedCategory === cat ? pillActive : pillBase}
							>
								{CATEGORY_LABELS[cat].full}
							</button>
						))}
					</div>

					{/* Week status badge */}
					{selectedWeek && (
						<div className="text-xs text-muted-foreground">
							Estado: {WEEK_STATUS_LABELS[selectedWeek.status]}
						</div>
					)}

					{/* Match cards */}
					{filteredMatches.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2">
							{filteredMatches.map((m) => {
								const isPending = m.status === STATUS_PENDING;
								const isPlayed = m.status === STATUS_PLAYED;
								const isCancelled = m.status === STATUS_CANCELLED;

								/* Icon + text colors per status */
								const iconBg = isCancelled
									? "bg-destructive/15 text-destructive"
									: isPlayed
										? "bg-emerald-500/15 text-emerald-400"
										: "bg-muted-foreground/15 text-muted-foreground";

								const playerTextClass = isCancelled
									? "font-semibold text-destructive/70 line-through"
									: "font-semibold text-foreground transition-colors hover:text-primary";

								return (
									<div
										key={m.id}
										className={`glass flex items-center gap-3 rounded-2xl px-5 py-4 ${isCancelled ? "opacity-60" : ""}`}
									>
										{/* Tennis ball status indicator */}
										<div
											className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
										>
											<StarIcon className="h-4 w-4" />
										</div>

										{/* Players */}
										<div className="flex flex-1 flex-col gap-1">
											<div className="flex items-center gap-1.5 text-sm">
												<Link
													href={`/jugadores/${m.player_a_id}`}
													className={playerTextClass}
												>
													{m.player_a_name}
												</Link>
												<span className={isCancelled ? "text-destructive/50" : "text-muted-foreground"}>vs</span>
												<Link
													href={`/jugadores/${m.player_b_id}`}
													className={playerTextClass}
												>
													{m.player_b_name}
												</Link>
											</div>
											{isPlayed && (
												<span className="font-mono text-xs text-emerald-400">
													{m.score}
												</span>
											)}
											{isPending && (
												<span className="text-xs text-muted-foreground">Pendiente</span>
											)}
											{isCancelled && (
												<span className="text-xs text-destructive">Cancelado</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						selectedWeek && (
							<div className="glass rounded-2xl p-6 text-center text-muted-foreground">
								No hay partidos de {CATEGORY_LABELS[selectedCategory].full} esta semana.
							</div>
						)
					)}

					{/* Bye notice */}
					{byePlayers.length > 0 && (
						<div className="glass flex items-start gap-3 rounded-2xl px-5 py-4">
							<Coffee className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
							<div className="text-sm">
								<span className="font-semibold text-foreground">
									Descansan esta semana:{" "}
								</span>
								<span className="text-muted-foreground">
									{byePlayers.map((a) => a.player_name).join(", ")}
								</span>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
