"use client";

import { useState } from "react";
import type { Match } from "@/lib/db";

/**
 * Client-side filter for the calendar schedule.
 * Allows filtering by category and status (Pendiente / Jugado / Todos).
 */
export default function CalendarFilter({ matches }: { matches: Match[] }) {
	const [catFilter, setCatFilter] = useState<"all" | "M" | "F">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "pendiente" | "jugado">("all");

	const filtered = matches.filter((m) => {
		if (catFilter !== "all" && m.category !== catFilter) return false;
		if (statusFilter !== "all" && m.status !== statusFilter) return false;
		return true;
	});

	/* Group matches: pending first, then played (most recent first) */
	const pending = filtered.filter((m) => m.status === "pendiente");
	const played = filtered.filter((m) => m.status === "jugado");

	return (
		<>
			{/* Filters row */}
			<div className="flex flex-wrap gap-4">
				{/* Category filter */}
				<div className="flex gap-2">
					{(["all", "M", "F"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setCatFilter(f)}
							className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
								catFilter === f
									? "bg-court-700 text-white shadow"
									: "bg-gray-200 text-gray-600 hover:bg-gray-300"
							}`}
						>
							{f === "all" ? "Todas" : f === "M" ? "Masc" : "Fem"}
						</button>
					))}
				</div>

				{/* Status filter */}
				<div className="flex gap-2">
					{(["all", "pendiente", "jugado"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setStatusFilter(f)}
							className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
								statusFilter === f
									? "bg-court-700 text-white shadow"
									: "bg-gray-200 text-gray-600 hover:bg-gray-300"
							}`}
						>
							{f === "all"
								? "Todos"
								: f === "pendiente"
									? "Pendientes"
									: "Jugados"}
						</button>
					))}
				</div>
			</div>

			{/* Count summary */}
			<p className="text-sm text-gray-500">
				{filtered.length} partido{filtered.length !== 1 ? "s" : ""} &middot;{" "}
				{pending.length} pendiente{pending.length !== 1 ? "s" : ""} &middot;{" "}
				{played.length} jugado{played.length !== 1 ? "s" : ""}
			</p>

			{/* Match list */}
			{filtered.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
					No hay partidos para mostrar.
				</div>
			) : (
				<div className="space-y-2">
					{/* Pending matches */}
					{pending.length > 0 && (
						<>
							<h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-2">
								Pendientes
							</h2>
							{pending.map((match) => (
								<MatchRow key={match.id} match={match} />
							))}
						</>
					)}

					{/* Played matches */}
					{played.length > 0 && (
						<>
							<h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-4">
								Jugados
							</h2>
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

/**
 * Single match row — shows players, status badge, score, and date.
 */
function MatchRow({ match }: { match: Match }) {
	return (
		<div className="bg-white rounded-lg shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
			{/* Players */}
			<div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
				<span className="font-medium text-gray-800 truncate">
					{match.player_a_name}
				</span>
				<span className="text-gray-400 text-sm">vs</span>
				<span className="font-medium text-gray-800 truncate">
					{match.player_b_name}
				</span>
			</div>

			{/* Right side: status, score, date, category badge */}
			<div className="flex items-center gap-3 text-sm shrink-0">
				{match.status === "jugado" ? (
					<>
						<span className="font-bold text-court-700">{match.score}</span>
						{match.date_played && (
							<span className="text-gray-400">
								{new Date(match.date_played).toLocaleDateString("es-ES", {
									day: "numeric",
									month: "short",
								})}
							</span>
						)}
						<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
							Jugado
						</span>
					</>
				) : (
					<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
						Pendiente
					</span>
				)}

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
		</div>
	);
}
