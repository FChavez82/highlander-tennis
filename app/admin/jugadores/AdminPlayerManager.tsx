"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Standing } from "@/lib/db";

/**
 * Admin player management — liquid glass style.
 */
export default function AdminPlayerManager({
	initialMasculino,
	initialFemenino,
}: {
	initialMasculino: Standing[];
	initialFemenino: Standing[];
}) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [category, setCategory] = useState<"M" | "F">("M");
	const [loading, setLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
	const [message, setMessage] = useState("");

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setLoading(true);
		setMessage("");

		try {
			const res = await fetch("/api/players", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), category }),
			});
			if (res.ok) {
				setName("");
				setMessage(`Jugador "${name.trim()}" agregado.`);
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete(playerId: number, playerName: string) {
		if (!confirm(`Eliminar a ${playerName}? Se eliminaran todos sus partidos.`)) return;
		setDeleteLoading(playerId);
		setMessage("");

		try {
			const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
			if (res.ok) {
				setMessage(`Jugador "${playerName}" eliminado.`);
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		} finally {
			setDeleteLoading(null);
		}
	}

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{/* Add player form */}
			<div className="lg-card" style={{ padding: 20 }}>
				<h2 className="lg-h2">Agregar Jugador</h2>
				<form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre del jugador"
						className="lg-input"
						style={{ flex: 1, minWidth: 200 }}
						required
					/>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value as "M" | "F")}
						className="lg-select"
					>
						<option value="M">Masculino</option>
						<option value="F">Femenino</option>
					</select>
					<button type="submit" disabled={loading} className="lg-btn lg-btn-primary">
						{loading ? "Agregando..." : "Agregar"}
					</button>
				</form>
				{message && (
					<div className={`lg-message ${message.startsWith("Error") ? "lg-message-error" : "lg-message-success"}`} style={{ marginTop: 10 }}>
						{message}
					</div>
				)}
			</div>

			{/* Player lists */}
			<PlayerList title="Masculino" players={initialMasculino} deleteLoading={deleteLoading} onDelete={handleDelete} />
			<PlayerList title="Femenino" players={initialFemenino} deleteLoading={deleteLoading} onDelete={handleDelete} />
		</div>
	);
}

function PlayerList({
	title,
	players,
	deleteLoading,
	onDelete,
}: {
	title: string;
	players: Standing[];
	deleteLoading: number | null;
	onDelete: (id: number, name: string) => void;
}) {
	return (
		<div className="lg-card" style={{ padding: 20 }}>
			<h2 className="lg-h2">{title} ({players.length})</h2>

			{players.length === 0 ? (
				<div className="lg-muted" style={{ textAlign: "center", padding: 16, fontSize: 14 }}>
					No hay jugadores en esta categoria.
				</div>
			) : (
				<div style={{ display: "grid", gap: 8 }}>
					{players.map((player) => (
						<div
							key={player.id}
							className="lg-list-item"
							style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
						>
							<div>
								<b>{player.name}</b>
								<span className="lg-muted" style={{ fontSize: 12, marginLeft: 8 }}>
									{player.played} jugados / {player.pending} pend.
								</span>
							</div>
							<button
								onClick={() => onDelete(player.id, player.name)}
								disabled={deleteLoading === player.id}
								className="lg-pill"
								style={{ color: "#f87171", fontSize: 12, padding: "6px 10px" }}
							>
								{deleteLoading === player.id ? "..." : "Eliminar"}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
