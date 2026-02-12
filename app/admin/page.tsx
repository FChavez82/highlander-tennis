/**
 * /admin — Dashboard with quick stats about the tournament.
 */
import { getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
	const stats = await getStats();
	const totalPlayers = stats.players.M + stats.players.F;
	const totalMatches = stats.matches.pendiente + stats.matches.jugado;

	return (
		<div className="space-y-6">
			{/* Stats grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<StatCard
					label="Jugadores"
					value={totalPlayers}
					detail={`${stats.players.M} M / ${stats.players.F} F`}
					color="bg-blue-50 text-blue-700"
				/>
				<StatCard
					label="Total Partidos"
					value={totalMatches}
					color="bg-gray-50 text-gray-700"
				/>
				<StatCard
					label="Pendientes"
					value={stats.matches.pendiente}
					color="bg-yellow-50 text-yellow-700"
				/>
				<StatCard
					label="Jugados"
					value={stats.matches.jugado}
					color="bg-green-50 text-green-700"
				/>
			</div>

			{/* Quick links */}
			<div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
				<h2 className="text-lg font-semibold text-gray-800">
					Acciones Rápidas
				</h2>
				<div className="flex gap-3 flex-wrap">
					<a
						href="/admin/jugadores"
						className="px-4 py-2 bg-court-700 text-white rounded-lg text-sm font-medium hover:bg-court-800 transition-colors"
					>
						Gestionar Jugadores
					</a>
					<a
						href="/admin/resultados"
						className="px-4 py-2 bg-court-700 text-white rounded-lg text-sm font-medium hover:bg-court-800 transition-colors"
					>
						Registrar Resultados
					</a>
				</div>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	detail,
	color,
}: {
	label: string;
	value: number;
	detail?: string;
	color: string;
}) {
	return (
		<div className={`rounded-xl p-4 ${color}`}>
			<div className="text-3xl font-bold">{value}</div>
			<div className="text-sm font-medium mt-1">{label}</div>
			{detail && (
				<div className="text-xs opacity-70 mt-0.5">{detail}</div>
			)}
		</div>
	);
}
