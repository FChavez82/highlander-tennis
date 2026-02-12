/**
 * /admin — Dashboard with quick stats, liquid glass style.
 */
import { getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
	const stats = await getStats();
	const totalPlayers = stats.players.M + stats.players.F;
	const totalMatches = stats.matches.pendiente + stats.matches.jugado;

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{/* Stats grid */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="lg-grid-3">
				<div className="lg-stat">
					<div className="value" style={{ color: "#a5b4fc" }}>{totalPlayers}</div>
					<div className="label">Jugadores</div>
					<div className="detail">{stats.players.M} M / {stats.players.F} F</div>
				</div>
				<div className="lg-stat">
					<div className="value">{totalMatches}</div>
					<div className="label">Total Partidos</div>
				</div>
				<div className="lg-stat">
					<div className="value" style={{ color: "#fbbf24" }}>{stats.matches.pendiente}</div>
					<div className="label">Pendientes</div>
				</div>
				<div className="lg-stat">
					<div className="value" style={{ color: "#4ade80" }}>{stats.matches.jugado}</div>
					<div className="label">Jugados</div>
				</div>
			</div>

			{/* Quick actions */}
			<div className="lg-card" style={{ padding: 20 }}>
				<h2 className="lg-h2">Acciones Rapidas</h2>
				<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
					<a href="/admin/jugadores" className="lg-btn lg-btn-primary">Gestionar Jugadores</a>
					<a href="/admin/resultados" className="lg-btn lg-btn-primary">Registrar Resultados</a>
				</div>
			</div>
		</div>
	);
}
