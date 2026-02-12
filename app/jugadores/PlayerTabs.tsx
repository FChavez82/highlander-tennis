"use client";

import { useState } from "react";
import type { Standing } from "@/lib/db";

/**
 * Client-side tabs for switching between Masculino and Femenino categories.
 * Displays a standings table for each category.
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
			{/* Tab buttons */}
			<div className="flex gap-2">
				<button
					onClick={() => setTab("M")}
					className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
						tab === "M"
							? "bg-court-700 text-white shadow"
							: "bg-gray-200 text-gray-600 hover:bg-gray-300"
					}`}
				>
					Masculino ({masculino.length})
				</button>
				<button
					onClick={() => setTab("F")}
					className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
						tab === "F"
							? "bg-court-700 text-white shadow"
							: "bg-gray-200 text-gray-600 hover:bg-gray-300"
					}`}
				>
					Femenino ({femenino.length})
				</button>
			</div>

			{/* Standings table */}
			{players.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
					No hay jugadores registrados en esta categoría.
				</div>
			) : (
				<div className="bg-white rounded-xl shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-court-50 text-court-800 text-left">
									<th className="px-4 py-3 font-semibold">#</th>
									<th className="px-4 py-3 font-semibold">Jugador</th>
									<th className="px-4 py-3 font-semibold text-center">G</th>
									<th className="px-4 py-3 font-semibold text-center">P</th>
									<th className="px-4 py-3 font-semibold text-center">Jugados</th>
									<th className="px-4 py-3 font-semibold text-center">Pend.</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{players.map((player, i) => (
									<tr
										key={player.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-4 py-3 text-gray-500 font-medium">
											{i + 1}
										</td>
										<td className="px-4 py-3 font-medium">
											{player.name}
										</td>
										<td className="px-4 py-3 text-center text-green-600 font-semibold">
											{player.won}
										</td>
										<td className="px-4 py-3 text-center text-red-500 font-semibold">
											{player.lost}
										</td>
										<td className="px-4 py-3 text-center text-gray-600">
											{player.played}
										</td>
										<td className="px-4 py-3 text-center text-gray-400">
											{player.pending}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Legend */}
					<div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex gap-4">
						<span>G = Ganados</span>
						<span>P = Perdidos</span>
						<span>Pend. = Pendientes</span>
					</div>
				</div>
			)}
		</>
	);
}
