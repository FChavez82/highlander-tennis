"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";

/**
 * Client-side filter for match results — allows filtering by category.
 * Displays results as cards with player names, score, and date.
 */
export default function ResultsFilter({ matches }: { matches: Match[] }) {
	const [filter, setFilter] = useState<"all" | "M" | "F">("all");

	const filtered =
		filter === "all"
			? matches
			: matches.filter((m) => m.category === filter);

	return (
		<>
			{/* Filter buttons */}
			<div className="flex gap-2">
				{(["all", "M", "F"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							filter === f
								? "bg-court-700 text-white shadow"
								: "bg-gray-200 text-gray-600 hover:bg-gray-300"
						}`}
					>
						{f === "all" ? "Todos" : f === "M" ? "Masculino" : "Femenino"}
					</button>
				))}
			</div>

			{/* Results list */}
			{filtered.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
					No hay resultados disponibles.
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((match) => (
						<div
							key={match.id}
							className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
						>
							{/* Players and score */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-semibold text-gray-800 truncate">
										{match.player_a_name}
									</span>
									<span className="text-gray-400 text-sm">vs</span>
									<span className="font-semibold text-gray-800 truncate">
										{match.player_b_name}
									</span>
								</div>
								<div className="mt-1 text-lg font-bold text-court-700">
									{match.score}
								</div>
							</div>

							{/* Metadata */}
							<div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
								<span
									className={`px-2 py-0.5 rounded-full text-xs font-medium ${
										match.category === "M"
											? "bg-blue-100 text-blue-700"
											: "bg-pink-100 text-pink-700"
									}`}
								>
									{match.category === "M" ? "Masc" : "Fem"}
								</span>
								{match.date_played && (
									<span>
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
