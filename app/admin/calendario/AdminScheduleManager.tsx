"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	CalendarPlus,
	Calendar,
	Shuffle,
	Eye,
	Trash2,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	AlertTriangle,
	Users,
	Ban,
} from "lucide-react";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	STATUS_CANCELLED,
	WEEK_STATUS_DRAFT,
	WEEK_STATUS_PUBLISHED,
	WEEK_STATUS_COMPLETED,
	WEEK_STATUS_LABELS,
	type Category,
	type WeekStatus,
} from "@/lib/constants";
import type { WeekWithData } from "./page";
import AvailabilityPanel from "./AvailabilityPanel";

/* ── Status badge styles ───────────────────────────────────────── */
function statusBadgeClass(status: WeekStatus): string {
	switch (status) {
		case WEEK_STATUS_DRAFT:
			return "bg-yellow-400/15 text-yellow-400 ring-yellow-400/25";
		case WEEK_STATUS_PUBLISHED:
			return "bg-emerald-400/15 text-emerald-400 ring-emerald-400/25";
		case WEEK_STATUS_COMPLETED:
			return "bg-blue-400/15 text-blue-400 ring-blue-400/25";
	}
}

/* ── Date formatting ───────────────────────────────────────────── */
/** Normalize a Postgres date (may be Date object or string) to a safe Date */
function safeDate(d: string | Date): Date {
	if (d instanceof Date) return d;
	/* If it's a YYYY-MM-DD string, add noon to avoid timezone shifts */
	return new Date(d + "T12:00:00");
}

function formatDateRange(start: string | Date, end: string | Date): string {
	const s = safeDate(start);
	const e = safeDate(end);
	const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
	return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", opts)}`;
}

/* ── Match summary per category for a week ─────────────────────── */
function categorySummary(week: WeekWithData, cat: Category): string {
	const matches = week.matches.filter((m) => m.category === cat);
	const available = week.availability.filter(
		(a) => a.player_category === cat && a.available
	);
	const unavailable = week.availability.filter(
		(a) => a.player_category === cat && !a.available
	);

	if (matches.length === 0 && available.length === 0) return "Sin jugadores";

	const parts: string[] = [];
	if (matches.length > 0) parts.push(`${matches.length} partido${matches.length !== 1 ? "s" : ""}`);
	if (available.length > 0 && matches.length === 0) parts.push(`${available.length} disponible${available.length !== 1 ? "s" : ""}`);
	if (unavailable.length > 0) parts.push(`${unavailable.length} no disponible${unavailable.length !== 1 ? "s" : ""}`);

	return parts.join(", ");
}

export default function AdminScheduleManager({
	initialWeeks,
}: {
	initialWeeks: WeekWithData[];
}) {
	const router = useRouter();
	const [weeks] = useState(initialWeeks);
	const [generating, setGenerating] = useState(false);
	const [actionLoading, setActionLoading] = useState<Record<number, string>>({});
	const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
	const [cancellingMatch, setCancellingMatch] = useState<number | null>(null);

	/* ── Cancel a single match ───────────────────────────────── */
	async function handleCancelMatch(matchId: number) {
		if (!confirm("¿Cancelar este partido? El emparejamiento quedara disponible para futuras semanas.")) return;
		setCancellingMatch(matchId);
		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cancel: true }),
			});
			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Error al cancelar partido.");
				return;
			}
			router.refresh();
		} catch {
			alert("Error de conexion.");
		} finally {
			setCancellingMatch(null);
		}
	}

	/* ── Generate next 2 weeks ───────────────────────────────── */
	async function handleGenerateWeeks() {
		setGenerating(true);
		try {
			const res = await fetch("/api/schedule", { method: "POST" });
			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Error al generar semanas.");
				return;
			}
			router.refresh();
		} catch {
			alert("Error de conexion.");
		} finally {
			setGenerating(false);
		}
	}

	/* ── Generic week action (generate matches, publish, complete, delete) ── */
	async function handleWeekAction(weekId: number, action: string) {
		setActionLoading((prev) => ({ ...prev, [weekId]: action }));
		try {
			let res: Response;

			if (action === "generate_matches") {
				res = await fetch(`/api/schedule/${weekId}/generate`, { method: "POST" });
			} else if (action === "delete") {
				if (!confirm("¿Eliminar esta semana y todos sus partidos?")) return;
				res = await fetch(`/api/schedule/${weekId}`, { method: "DELETE" });
			} else {
				/* status update: publish or complete */
				res = await fetch(`/api/schedule/${weekId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: action }),
				});
			}

			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Error en la operacion.");
				return;
			}

			router.refresh();
		} catch {
			alert("Error de conexion.");
		} finally {
			setActionLoading((prev) => {
				const copy = { ...prev };
				delete copy[weekId];
				return copy;
			});
		}
	}

	return (
		<div className="grid gap-5">
			{/* Header + generate button */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
					Calendario de Partidos
				</h1>
				<button
					onClick={handleGenerateWeeks}
					disabled={generating}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 glass-interactive"
				>
					<CalendarPlus className="h-4 w-4" />
					{generating ? "Generando..." : "Generar Proximas 2 Semanas"}
				</button>
			</div>

			{/* Empty state */}
			{weeks.length === 0 && (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					<Calendar className="mx-auto mb-3 h-8 w-8 opacity-50" />
					<p>No hay semanas programadas.</p>
					<p className="mt-1 text-sm">
						Haz clic en &quot;Generar Proximas 2 Semanas&quot; para comenzar.
					</p>
				</div>
			)}

			{/* Week cards */}
			{weeks.map((week) => {
				const isExpanded = expandedWeek === week.id;
				const loading = actionLoading[week.id];
				const isDraft = week.status === WEEK_STATUS_DRAFT;
				const isPublished = week.status === WEEK_STATUS_PUBLISHED;
				const hasMatches = week.matches.length > 0;

				return (
					<div key={week.id} className="glass rounded-2xl overflow-hidden">
						{/* Week header */}
						<div className="flex flex-wrap items-center gap-3 p-5">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<h2 className="font-display text-lg font-bold text-foreground">
										Semana {week.week_number}
									</h2>
									<span
										className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase leading-none ring-1 ${statusBadgeClass(week.status)}`}
									>
										{WEEK_STATUS_LABELS[week.status]}
									</span>
								</div>
								<div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
									<Calendar className="h-3.5 w-3.5" />
									{formatDateRange(week.start_date, week.end_date)}
								</div>
							</div>

							{/* Category summaries */}
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<span className="h-2 w-2 rounded-full bg-cat-male/60" />
									{CATEGORY_LABELS[CATEGORY_MALE].full}: {categorySummary(week, CATEGORY_MALE)}
								</span>
								<span className="inline-flex items-center gap-1">
									<span className="h-2 w-2 rounded-full bg-cat-female/60" />
									{CATEGORY_LABELS[CATEGORY_FEMALE].full}: {categorySummary(week, CATEGORY_FEMALE)}
								</span>
							</div>
						</div>

						{/* Action buttons */}
						<div className="flex flex-wrap gap-2 border-t border-[hsl(210_20%_40%/0.08)] px-5 py-3">
							{/* Expand/collapse availability */}
							<button
								onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
								className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(210_20%_80%/0.12)] glass-interactive"
							>
								<Users className="h-3.5 w-3.5" />
								Disponibilidad
								{isExpanded ? (
									<ChevronUp className="h-3 w-3" />
								) : (
									<ChevronDown className="h-3 w-3" />
								)}
							</button>

							{/* Generate matches (draft only) */}
							{isDraft && (
								<button
									onClick={() => handleWeekAction(week.id, "generate_matches")}
									disabled={!!loading}
									className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25 disabled:opacity-50 glass-interactive"
								>
									<Shuffle className="h-3.5 w-3.5" />
									{loading === "generate_matches" ? "Generando..." : "Generar Partidos"}
								</button>
							)}

							{/* Publish (draft only, needs matches) */}
							{isDraft && hasMatches && (
								<button
									onClick={() => handleWeekAction(week.id, WEEK_STATUS_PUBLISHED)}
									disabled={!!loading}
									className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50 glass-interactive"
								>
									<Eye className="h-3.5 w-3.5" />
									{loading === WEEK_STATUS_PUBLISHED ? "Publicando..." : "Publicar"}
								</button>
							)}

							{/* Mark complete (published only) */}
							{isPublished && (
								<button
									onClick={() => handleWeekAction(week.id, WEEK_STATUS_COMPLETED)}
									disabled={!!loading}
									className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/25 disabled:opacity-50 glass-interactive"
								>
									<CheckCircle className="h-3.5 w-3.5" />
									{loading === WEEK_STATUS_COMPLETED ? "Completando..." : "Completar"}
								</button>
							)}

							{/* Delete (draft only) */}
							{isDraft && (
								<button
									onClick={() => handleWeekAction(week.id, "delete")}
									disabled={!!loading}
									className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50 glass-interactive"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Eliminar
								</button>
							)}
						</div>

						{/* Expanded availability panel */}
						{isExpanded && (
							<AvailabilityPanel
								weekId={week.id}
								availability={week.availability}
								isDraft={isDraft}
							/>
						)}

						{/* Match list (when matches exist) */}
						{hasMatches && (
							<div className="border-t border-[hsl(210_20%_40%/0.08)] px-5 py-4">
								<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Partidos
								</h3>
								<div className="grid gap-2 sm:grid-cols-2">
									{week.matches.map((m) => {
										const isCancelled = m.status === STATUS_CANCELLED;

										return (
											<div
												key={m.id}
												className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${
													isCancelled
														? "bg-destructive/[0.04] ring-destructive/20 opacity-60"
														: "bg-[hsl(210_20%_80%/0.04)] ring-[hsl(210_20%_40%/0.08)]"
												}`}
											>
												<div className="flex items-center gap-2 text-sm">
													<span
														className={`h-2 w-2 rounded-full ${m.category === CATEGORY_MALE ? "bg-cat-male/60" : "bg-cat-female/60"}`}
													/>
													<span className={isCancelled ? "text-destructive/70 line-through" : "font-semibold text-foreground"}>
														{m.player_a_name}
													</span>
													<span className={isCancelled ? "text-destructive/50" : "text-muted-foreground"}>vs</span>
													<span className={isCancelled ? "text-destructive/70 line-through" : "font-semibold text-foreground"}>
														{m.player_b_name}
													</span>
													{isCancelled && (
														<span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive ring-1 ring-destructive/25">
															Cancelado
														</span>
													)}
												</div>
												<div className="flex items-center gap-2">
													{m.status === "jugado" && m.score && (
														<span className="font-mono text-xs text-muted-foreground">
															{m.score}
														</span>
													)}
													{m.status === "pendiente" && (
														<button
															onClick={() => handleCancelMatch(m.id)}
															disabled={cancellingMatch === m.id}
															className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
															title="Cancelar partido"
														>
															<Ban className="h-3 w-3" />
															Cancelar
														</button>
													)}
												</div>
											</div>
										);
									})}
								</div>

								{/* Warn about unpaired players */}
								{(() => {
									/* Players who are available but have no match this week */
									const matchedIds = new Set(
										week.matches.flatMap((m) => [m.player_a_id, m.player_b_id])
									);
									const unpaired = week.availability.filter(
										(a) => a.available && !matchedIds.has(a.player_id)
									);
									if (unpaired.length === 0) return null;
									return (
										<div className="mt-3 flex items-start gap-2 rounded-xl bg-yellow-400/[0.06] px-4 py-3 text-xs text-yellow-400 ring-1 ring-yellow-400/15">
											<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
											<div>
												<span className="font-semibold">Descansan esta semana: </span>
												{unpaired.map((a) => a.player_name).join(", ")}
											</div>
										</div>
									);
								})()}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
