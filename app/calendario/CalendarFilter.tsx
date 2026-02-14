"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";
import {
	CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS,
	STATUS_PENDING, STATUS_PLAYED, STATUS_LABELS,
	type Category, type MatchStatus,
} from "@/lib/constants";

/** Pill base */
const pillBase =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
/** Pill active */
const pillActive =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/**
 * Calendar filter and display — v0 glass design.
 */
export default function CalendarFilter({ matches }: { matches: Match[] }) {
	const [catFilter, setCatFilter] = useState<"all" | Category>("all");
	const [statusFilter, setStatusFilter] = useState<"all" | MatchStatus>("all");

	const filtered = matches.filter((m) => {
		if (catFilter !== "all" && m.category !== catFilter) return false;
		if (statusFilter !== "all" && m.status !== statusFilter) return false;
		return true;
	});

	const pending = filtered.filter((m) => m.status === STATUS_PENDING);
	const played = filtered.filter((m) => m.status === STATUS_PLAYED);

	return (
		<>
			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				<div className="flex gap-2">
					{(["all", CATEGORY_MALE, CATEGORY_FEMALE] as const).map((f) => (
						<button
							key={f}
							onClick={() => setCatFilter(f)}
							className={catFilter === f ? pillActive : pillBase}
						>
							{f === "all" ? "Todas" : CATEGORY_LABELS[f].short}
						</button>
					))}
				</div>
				<div className="flex gap-2">
					{(["all", STATUS_PENDING, STATUS_PLAYED] as const).map((f) => (
						<button
							key={f}
							onClick={() => setStatusFilter(f)}
							className={statusFilter === f ? pillActive : pillBase}
						>
							{f === "all" ? "Todos" : STATUS_LABELS[f].full}
						</button>
					))}
				</div>
			</div>

			{/* Summary */}
			<p className="text-sm text-muted-foreground">
				{filtered.length} partido{filtered.length !== 1 ? "s" : ""} &middot;{" "}
				{pending.length} pendiente{pending.length !== 1 ? "s" : ""} &middot;{" "}
				{played.length} jugado{played.length !== 1 ? "s" : ""}
			</p>

			{/* Match list */}
			{filtered.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay partidos para mostrar.
				</div>
			) : (
				<div className="grid gap-3">
					{pending.length > 0 && (
						<>
							<p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Pendientes
							</p>
							{pending.map((match) => (
								<MatchRow key={match.id} match={match} />
							))}
						</>
					)}
					{played.length > 0 && (
						<>
							<p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Jugados
							</p>
							{played.map((match) => (
								<MatchRow key={match.id} match={match} />
							))}
						</>
					)}
				</div>
			)}
		</>
	);
}

function MatchRow({ match }: { match: Match }) {
	return (
		<div className="glass-light flex flex-wrap items-center gap-2.5 rounded-xl p-3 transition-shadow hover:glass-glow-primary">
			{/* Players */}
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
				<b className="text-foreground">{match.player_a_name}</b>
				<span className="text-xs text-muted-foreground">vs</span>
				<b className="text-foreground">{match.player_b_name}</b>
			</div>

			{/* Right side */}
			<div className="flex flex-shrink-0 items-center gap-2">
				{match.status === STATUS_PLAYED ? (
					<>
						<span className="font-mono text-sm font-extrabold text-primary">
							{match.score}
						</span>
						{match.date_played && (
							<span className="text-xs text-muted-foreground">
								{new Date(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
							</span>
						)}
						<span className="inline-flex rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/25">
							Jugado
						</span>
					</>
				) : (
					<span className="inline-flex rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-accent/25">
						Pendiente
					</span>
				)}
				<span
					className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
						match.category === CATEGORY_MALE
							? "bg-primary/15 text-primary ring-primary/25"
							: "bg-accent/15 text-accent ring-accent/25"
					}`}
				>
					{match.category}
				</span>
			</div>
		</div>
	);
}
