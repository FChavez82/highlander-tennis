"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/lib/db";

/**
 * Admin results management — enter results for pending matches,
 * edit or delete completed matches.
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

	/* Track which match is being edited (for the inline form) */
	const [editingId, setEditingId] = useState<number | null>(null);
	const [score, setScore] = useState("");
	const [datePlayed, setDatePlayed] = useState("");
	const [saving, setSaving] = useState(false);

	/* Start editing a match — pre-fill form if it already has data */
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

	/* Save a match result */
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
				setMessage("Resultado guardado con éxito.");
				cancelEdit();
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexión.");
		} finally {
			setSaving(false);
		}
	}

	/* Reset a match back to pending */
	async function handleReset(matchId: number) {
		if (!confirm("¿Borrar el resultado y marcar como pendiente?")) return;

		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reset: true }),
			});

			if (res.ok) {
				setMessage("Resultado borrado, partido marcado como pendiente.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexión.");
		}
	}

	/* Delete a match entirely */
	async function handleDelete(matchId: number) {
		if (!confirm("¿Eliminar este partido permanentemente?")) return;

		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				setMessage("Partido eliminado.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexión.");
		}
	}

	return (
		<div className="space-y-6">
			{message && (
				<div
					className={`p-3 rounded-lg text-sm ${
						message.startsWith("Error")
							? "bg-red-50 text-red-700"
							: "bg-green-50 text-green-700"
					}`}
				>
					{message}
				</div>
			)}

			{/* Pending matches — enter result */}
			<div className="bg-white rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-3 bg-yellow-50 border-b">
					<h2 className="font-semibold text-yellow-800">
						Partidos Pendientes ({initialPending.length})
					</h2>
				</div>

				{initialPending.length === 0 ? (
					<div className="p-6 text-center text-gray-500 text-sm">
						No hay partidos pendientes.
					</div>
				) : (
					<ul className="divide-y divide-gray-100">
						{initialPending.map((match) => (
							<li key={match.id} className="px-6 py-3">
								<div className="flex flex-col sm:flex-row sm:items-center gap-2">
									{/* Match info */}
									<div className="flex-1 flex items-center gap-2 flex-wrap">
										<span className="font-medium text-gray-800">
											{match.player_a_name}
										</span>
										<span className="text-gray-400 text-sm">vs</span>
										<span className="font-medium text-gray-800">
											{match.player_b_name}
										</span>
										<span
											className={`px-2 py-0.5 rounded-full text-xs font-medium ${
												match.category === "M"
													? "bg-blue-100 text-blue-700"
													: "bg-pink-100 text-pink-700"
											}`}
										>
											{match.category === "M" ? "M" : "F"}
										</span>
									</div>

									{/* Action button */}
									{editingId === match.id ? (
										<button
											onClick={cancelEdit}
											className="text-gray-500 hover:text-gray-700 text-sm"
										>
											Cancelar
										</button>
									) : (
										<button
											onClick={() => startEdit(match)}
											className="text-court-700 hover:text-court-800 text-sm font-medium"
										>
											Ingresar Resultado
										</button>
									)}
								</div>

								{/* Inline edit form */}
								{editingId === match.id && (
									<div className="mt-3 flex flex-col sm:flex-row gap-2">
										<input
											type="text"
											value={score}
											onChange={(e) => setScore(e.target.value)}
											placeholder='Marcador (ej: "6-4, 3-6, [10-7]")'
											className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
										/>
										<input
											type="date"
											value={datePlayed}
											onChange={(e) => setDatePlayed(e.target.value)}
											className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
										/>
										<button
											onClick={() => handleSave(match.id)}
											disabled={saving}
											className="px-4 py-1.5 bg-court-700 text-white rounded-lg text-sm font-medium hover:bg-court-800 transition-colors disabled:opacity-50"
										>
											{saving ? "Guardando..." : "Guardar"}
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Completed matches — edit/delete */}
			<div className="bg-white rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-3 bg-green-50 border-b">
					<h2 className="font-semibold text-green-800">
						Partidos Jugados ({initialPlayed.length})
					</h2>
				</div>

				{initialPlayed.length === 0 ? (
					<div className="p-6 text-center text-gray-500 text-sm">
						No hay partidos completados.
					</div>
				) : (
					<ul className="divide-y divide-gray-100">
						{initialPlayed.map((match) => (
							<li key={match.id} className="px-6 py-3">
								<div className="flex flex-col sm:flex-row sm:items-center gap-2">
									{/* Match info with score */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-medium text-gray-800">
												{match.player_a_name}
											</span>
											<span className="text-gray-400 text-sm">vs</span>
											<span className="font-medium text-gray-800">
												{match.player_b_name}
											</span>
											<span
												className={`px-2 py-0.5 rounded-full text-xs font-medium ${
													match.category === "M"
														? "bg-blue-100 text-blue-700"
														: "bg-pink-100 text-pink-700"
												}`}
											>
												{match.category === "M" ? "M" : "F"}
											</span>
										</div>
										<div className="text-sm text-court-700 font-semibold mt-0.5">
											{match.score}
											{match.date_played && (
												<span className="text-gray-400 font-normal ml-2">
													{new Date(match.date_played).toLocaleDateString("es-ES", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
												</span>
											)}
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex gap-2 shrink-0">
										{editingId === match.id ? (
											<button
												onClick={cancelEdit}
												className="text-gray-500 hover:text-gray-700 text-sm"
											>
												Cancelar
											</button>
										) : (
											<button
												onClick={() => startEdit(match)}
												className="text-court-700 hover:text-court-800 text-sm font-medium"
											>
												Editar
											</button>
										)}
										<button
											onClick={() => handleReset(match.id)}
											className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
										>
											Resetear
										</button>
										<button
											onClick={() => handleDelete(match.id)}
											className="text-red-500 hover:text-red-700 text-sm font-medium"
										>
											Eliminar
										</button>
									</div>
								</div>

								{/* Inline edit form for played matches */}
								{editingId === match.id && (
									<div className="mt-3 flex flex-col sm:flex-row gap-2">
										<input
											type="text"
											value={score}
											onChange={(e) => setScore(e.target.value)}
											placeholder='Marcador (ej: "6-4, 3-6, [10-7]")'
											className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
										/>
										<input
											type="date"
											value={datePlayed}
											onChange={(e) => setDatePlayed(e.target.value)}
											className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
										/>
										<button
											onClick={() => handleSave(match.id)}
											disabled={saving}
											className="px-4 py-1.5 bg-court-700 text-white rounded-lg text-sm font-medium hover:bg-court-800 transition-colors disabled:opacity-50"
										>
											{saving ? "Guardando..." : "Guardar"}
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
