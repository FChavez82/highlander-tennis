"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";

/**
 * Results filter and display — liquid glass style.
 */
export default function ResultsFilter({ matches }: { matches: Match[] }) {
	const [filter, setFilter] = useState<"all" | "M" | "F">("all");

	const filtered =
		filter === "all"
			? matches
			: matches.filter((m) => m.category === filter);

	return (
		<>
			{/* Filter pills */}
			<div style={{ display: "flex", gap: 10 }}>
				{(["all", "M", "F"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`lg-pill ${filter === f ? "lg-pill-active" : ""}`}
					>
						{f === "all" ? "Todos" : f === "M" ? "Masculino" : "Femenino"}
					</button>
				))}
			</div>

			{/* Results */}
			{filtered.length === 0 ? (
				<div className="lg-card" style={{ padding: 32, textAlign: "center" }}>
					<span className="lg-muted">No hay resultados disponibles.</span>
				</div>
			) : (
				<div style={{ display: "grid", gap: 10 }}>
					{filtered.map((match) => (
						<div key={match.id} className="lg-list-item" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
							{/* Players */}
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
									<b>{match.player_a_name}</b>
									<span className="lg-muted" style={{ fontSize: 12 }}>vs</span>
									<b>{match.player_b_name}</b>
								</div>
								<div style={{ marginTop: 4, fontSize: 16, fontWeight: 800, color: "#a5b4fc" }}>
									{match.score}
								</div>
							</div>

							{/* Metadata */}
							<div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
								<span className={`lg-badge ${match.category === "M" ? "lg-badge-m" : "lg-badge-f"}`}>
									{match.category === "M" ? "Masc" : "Fem"}
								</span>
								{match.date_played && (
									<span className="lg-muted" style={{ fontSize: 12 }}>
										{new Date(match.date_played).toLocaleDateString("es-ES", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
