"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Standing } from "@/lib/db";

/**
 * Admin player management — add new players and remove existing ones.
 * Uses client-side state with optimistic updates via router.refresh().
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

	/* Add a new player */
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
				setMessage(`Jugador "${name.trim()}" agregado con éxito.`);
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexión.");
		} finally {
			setLoading(false);
		}
	}

	/* Delete a player */
	async function handleDelete(playerId: number, playerName: string) {
		if (!confirm(`¿Eliminar a ${playerName}? Se eliminarán también todos sus partidos.`)) {
			return;
		}

		setDeleteLoading(playerId);
		setMessage("");

		try {
			const res = await fetch(`/api/players/${playerId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				setMessage(`Jugador "${playerName}" eliminado.`);
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexión.");
		} finally {
			setDeleteLoading(null);
		}
	}

	return (
		<div className="space-y-6">
			{/* Add player form */}
			<div className="bg-white rounded-xl shadow-sm p-6">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">
					Agregar Jugador
				</h2>

				<form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre del jugador"
						className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
						required
					/>

					<select
						value={category}
						onChange={(e) => setCategory(e.target.value as "M" | "F")}
						className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
					>
						<option value="M">Masculino</option>
						<option value="F">Femenino</option>
					</select>

					<button
						type="submit"
						disabled={loading}
						className="px-6 py-2 bg-court-700 text-white rounded-lg font-medium hover:bg-court-800 transition-colors disabled:opacity-50 whitespace-nowrap"
					>
						{loading ? "Agregando..." : "Agregar"}
					</button>
				</form>

				{message && (
					<p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
						{message}
					</p>
				)}
			</div>

			{/* Player lists */}
			<PlayerList
				title="Masculino"
				players={initialMasculino}
				deleteLoading={deleteLoading}
				onDelete={handleDelete}
			/>
			<PlayerList
				title="Femenino"
				players={initialFemenino}
				deleteLoading={deleteLoading}
				onDelete={handleDelete}
			/>
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
		<div className="bg-white rounded-xl shadow-sm overflow-hidden">
			<div className="px-6 py-3 bg-court-50 border-b">
				<h3 className="font-semibold text-court-800">
					{title} ({players.length})
				</h3>
			</div>

			{players.length === 0 ? (
				<div className="p-6 text-center text-gray-500 text-sm">
					No hay jugadores en esta categoría.
				</div>
			) : (
				<ul className="divide-y divide-gray-100">
					{players.map((player) => (
						<li
							key={player.id}
							className="px-6 py-3 flex items-center justify-between hover:bg-gray-50"
						>
							<div>
								<span className="font-medium text-gray-800">
									{player.name}
								</span>
								<span className="text-xs text-gray-400 ml-2">
									{player.played} jugados / {player.pending} pend.
								</span>
							</div>
							<button
								onClick={() => onDelete(player.id, player.name)}
								disabled={deleteLoading === player.id}
								className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
							>
								{deleteLoading === player.id ? "Eliminando..." : "Eliminar"}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
