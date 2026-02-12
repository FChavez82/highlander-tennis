"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/lib/db";

/**
 * Admin results management — liquid glass style.
 */
export default function AdminResultsManager({
	initialPending,
	initialPlayed,
}: {
	initialPending: Match[];
	initialPlayed: Match[];
}) {
	const router = useRouter();
	const [message, setMessage] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [score, setScore] = useState("");
	const [datePlayed, setDatePlayed] = useState("");
	const [saving, setSaving] = useState(false);

	function startEdit(match: Match) {
		setEditingId(match.id);
		setScore(match.score || "");
		setDatePlayed(match.date_played || new Date().toISOString().split("T")[0]);
		setMessage("");
	}

	function cancelEdit() {
		setEditingId(null);
		setScore("");
		setDatePlayed("");
	}

	async function handleSave(matchId: number) {
		if (!score.trim() || !datePlayed) return;
		setSaving(true);
		setMessage("");

		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ score: score.trim(), date_played: datePlayed }),
			});
			if (res.ok) {
				setMessage("Resultado guardado.");
				cancelEdit();
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		} finally {
			setSaving(false);
		}
	}

	async function handleReset(matchId: number) {
		if (!confirm("Borrar el resultado y marcar como pendiente?")) return;
		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reset: true }),
			});
			if (res.ok) {
				setMessage("Resultado borrado.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		}
	}

	async function handleDelete(matchId: number) {
		if (!confirm("Eliminar este partido permanentemente?")) return;
		try {
			const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
			if (res.ok) {
				setMessage("Partido eliminado.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		}
	}

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{message && (
				<div className={`lg-message ${message.startsWith("Error") ? "lg-message-error" : "lg-message-success"}`}>
					{message}
				</div>
			)}

			{/* Pending matches */}
			<div className="lg-card" style={{ padding: 20 }}>
				<h2 className="lg-h2" style={{ color: "#fbbf24" }}>
					Pendientes ({initialPending.length})
				</h2>

				{initialPending.length === 0 ? (
					<div className="lg-muted" style={{ textAlign: "center", padding: 16, fontSize: 14 }}>
						No hay partidos pendientes.
					</div>
				) : (
					<div style={{ display: "grid", gap: 8 }}>
						{initialPending.map((match) => (
							<div key={match.id} className="lg-list-item">
								<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
									<div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
										<b>{match.player_a_name}</b>
										<span className="lg-muted" style={{ fontSize: 12 }}>vs</span>
										<b>{match.player_b_name}</b>
										<span className={`lg-badge ${match.category === "M" ? "lg-badge-m" : "lg-badge-f"}`}>
											{match.category === "M" ? "M" : "F"}
										</span>
									</div>
									{editingId === match.id ? (
										<button onClick={cancelEdit} className="lg-pill" style={{ fontSize: 12, padding: "6px 10px" }}>
											Cancelar
										</button>
									) : (
										<button onClick={() => startEdit(match)} className="lg-pill lg-pill-active" style={{ fontSize: 12, padding: "6px 10px" }}>
											Ingresar Resultado
										</button>
									)}
								</div>

								{editingId === match.id && (
									<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
										<input
											type="text"
											value={score}
											onChange={(e) => setScore(e.target.value)}
											placeholder='Marcador (ej: "6-4, 3-6, [10-7]")'
											className="lg-input"
											style={{ flex: 1, minWidth: 180 }}
										/>
										<input
											type="date"
											value={datePlayed}
											onChange={(e) => setDatePlayed(e.target.value)}
											className="lg-input"
											style={{ width: "auto" }}
										/>
										<button onClick={() => handleSave(match.id)} disabled={saving} className="lg-btn lg-btn-primary" style={{ fontSize: 13, padding: "8px 14px" }}>
											{saving ? "..." : "Guardar"}
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Played matches */}
			<div className="lg-card" style={{ padding: 20 }}>
				<h2 className="lg-h2" style={{ color: "#4ade80" }}>
					Jugados ({initialPlayed.length})
				</h2>

				{initialPlayed.length === 0 ? (
					<div className="lg-muted" style={{ textAlign: "center", padding: 16, fontSize: 14 }}>
						No hay partidos completados.
					</div>
				) : (
					<div style={{ display: "grid", gap: 8 }}>
						{initialPlayed.map((match) => (
							<div key={match.id} className="lg-list-item">
								<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
											<b>{match.player_a_name}</b>
											<span className="lg-muted" style={{ fontSize: 12 }}>vs</span>
											<b>{match.player_b_name}</b>
											<span className={`lg-badge ${match.category === "M" ? "lg-badge-m" : "lg-badge-f"}`}>
												{match.category === "M" ? "M" : "F"}
											</span>
										</div>
										<div style={{ fontSize: 14, fontWeight: 800, color: "#a5b4fc", marginTop: 4 }}>
											{match.score}
											{match.date_played && (
												<span className="lg-muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
													{new Date(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
												</span>
											)}
										</div>
									</div>

									<div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
										{editingId === match.id ? (
											<button onClick={cancelEdit} className="lg-pill" style={{ fontSize: 11, padding: "5px 8px" }}>Cancelar</button>
										) : (
											<button onClick={() => startEdit(match)} className="lg-pill" style={{ fontSize: 11, padding: "5px 8px" }}>Editar</button>
										)}
										<button onClick={() => handleReset(match.id)} className="lg-pill" style={{ fontSize: 11, padding: "5px 8px", color: "#fbbf24" }}>Resetear</button>
										<button onClick={() => handleDelete(match.id)} className="lg-pill" style={{ fontSize: 11, padding: "5px 8px", color: "#f87171" }}>Eliminar</button>
									</div>
								</div>

								{editingId === match.id && (
									<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
										<input
											type="text"
											value={score}
											onChange={(e) => setScore(e.target.value)}
											placeholder='Marcador'
											className="lg-input"
											style={{ flex: 1, minWidth: 180 }}
										/>
										<input
											type="date"
											value={datePlayed}
											onChange={(e) => setDatePlayed(e.target.value)}
											className="lg-input"
											style={{ width: "auto" }}
										/>
										<button onClick={() => handleSave(match.id)} disabled={saving} className="lg-btn lg-btn-primary" style={{ fontSize: 13, padding: "8px 14px" }}>
											{saving ? "..." : "Guardar"}
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
