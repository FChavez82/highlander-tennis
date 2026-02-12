"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";

/**
 * Calendar filter and display — liquid glass style.
 */
export default function CalendarFilter({ matches }: { matches: Match[] }) {
	const [catFilter, setCatFilter] = useState<"all" | "M" | "F">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "pendiente" | "jugado">("all");

	const filtered = matches.filter((m) => {
		if (catFilter !== "all" && m.category !== catFilter) return false;
		if (statusFilter !== "all" && m.status !== statusFilter) return false;
		return true;
	});

	const pending = filtered.filter((m) => m.status === "pendiente");
	const played = filtered.filter((m) => m.status === "jugado");

	return (
		<>
			{/* Filters */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
				<div style={{ display: "flex", gap: 8 }}>
					{(["all", "M", "F"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setCatFilter(f)}
							className={`lg-pill ${catFilter === f ? "lg-pill-active" : ""}`}
						>
							{f === "all" ? "Todas" : f === "M" ? "Masc" : "Fem"}
						</button>
					))}
				</div>
				<div style={{ display: "flex", gap: 8 }}>
					{(["all", "pendiente", "jugado"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setStatusFilter(f)}
							className={`lg-pill ${statusFilter === f ? "lg-pill-active" : ""}`}
						>
							{f === "all" ? "Todos" : f === "pendiente" ? "Pendientes" : "Jugados"}
						</button>
					))}
				</div>
			</div>

			{/* Summary */}
			<p className="lg-muted" style={{ fontSize: 13, margin: 0 }}>
				{filtered.length} partido{filtered.length !== 1 ? "s" : ""} &middot;{" "}
				{pending.length} pendiente{pending.length !== 1 ? "s" : ""} &middot;{" "}
				{played.length} jugado{played.length !== 1 ? "s" : ""}
			</p>

			{/* Match list */}
			{filtered.length === 0 ? (
				<div className="lg-card" style={{ padding: 32, textAlign: "center" }}>
					<span className="lg-muted">No hay partidos para mostrar.</span>
				</div>
			) : (
				<div style={{ display: "grid", gap: 10 }}>
					{pending.length > 0 && (
						<>
							<div className="lg-kicker" style={{ marginTop: 4 }}>Pendientes</div>
							{pending.map((match) => (
								<MatchRow key={match.id} match={match} />
							))}
						</>
					)}
					{played.length > 0 && (
						<>
							<div className="lg-kicker" style={{ marginTop: 8 }}>Jugados</div>
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
		<div className="lg-list-item" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
			{/* Players */}
			<div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
				<b>{match.player_a_name}</b>
				<span className="lg-muted" style={{ fontSize: 12 }}>vs</span>
				<b>{match.player_b_name}</b>
			</div>

			{/* Right side */}
			<div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
				{match.status === "jugado" ? (
					<>
						<span style={{ fontWeight: 800, color: "#a5b4fc" }}>{match.score}</span>
						{match.date_played && (
							<span className="lg-muted" style={{ fontSize: 12 }}>
								{new Date(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
							</span>
						)}
						<span className="lg-badge lg-badge-played">Jugado</span>
					</>
				) : (
					<span className="lg-badge lg-badge-pending">Pendiente</span>
				)}
				<span className={`lg-badge ${match.category === "M" ? "lg-badge-m" : "lg-badge-f"}`}>
					{match.category === "M" ? "M" : "F"}
				</span>
			</div>
		</div>
	);
}
