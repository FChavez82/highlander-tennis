"use client";

import { useState } from "react";
import type { Standing } from "@/lib/db";

/**
 * Standings table with M/F tabs — liquid glass style.
 */
export default function PlayerTabs({
	masculino,
	femenino,
}: {
	masculino: Standing[];
	femenino: Standing[];
}) {
	const [tab, setTab] = useState<"M" | "F">("M");
	const players = tab === "M" ? masculino : femenino;

	return (
		<>
			{/* Tab pills */}
			<div style={{ display: "flex", gap: 10 }}>
				<button
					onClick={() => setTab("M")}
					className={`lg-pill ${tab === "M" ? "lg-pill-active" : ""}`}
				>
					Masculino ({masculino.length})
				</button>
				<button
					onClick={() => setTab("F")}
					className={`lg-pill ${tab === "F" ? "lg-pill-active" : ""}`}
				>
					Femenino ({femenino.length})
				</button>
			</div>

			{/* Standings table */}
			{players.length === 0 ? (
				<div className="lg-card" style={{ padding: 32, textAlign: "center" }}>
					<span className="lg-muted">No hay jugadores registrados en esta categoria.</span>
				</div>
			) : (
				<div className="lg-card" style={{ padding: 16 }}>
					<div style={{ overflowX: "auto" }}>
						<table className="lg-table">
							<thead>
								<tr>
									<th>#</th>
									<th>Jugador</th>
									<th style={{ textAlign: "center" }}>G</th>
									<th style={{ textAlign: "center" }}>P</th>
									<th style={{ textAlign: "center" }}>Jugados</th>
									<th style={{ textAlign: "center" }}>Pend.</th>
								</tr>
							</thead>
							<tbody>
								{players.map((player, i) => (
									<tr key={player.id}>
										<td><b>{i + 1}</b></td>
										<td><b>{player.name}</b></td>
										<td style={{ textAlign: "center", color: "#4ade80", fontWeight: 700 }}>
											{player.won}
										</td>
										<td style={{ textAlign: "center", color: "#f87171", fontWeight: 700 }}>
											{player.lost}
										</td>
										<td style={{ textAlign: "center" }}>{player.played}</td>
										<td style={{ textAlign: "center" }}>{player.pending}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Legend */}
					<div style={{ display: "flex", gap: 16, padding: "8px 14px", fontSize: 11 }} className="lg-muted">
						<span>G = Ganados</span>
						<span>P = Perdidos</span>
						<span>Pend. = Pendientes</span>
					</div>
				</div>
			)}
		</>
	);
}
