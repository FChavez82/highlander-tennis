/**
 * /admin — Dashboard with quick stats, v0 glass design.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getStats } from "@/lib/db";
import { Users, CalendarDays, Clock, CheckCircle } from "lucide-react";
import { CATEGORY_MALE, CATEGORY_FEMALE, STATUS_PENDING, STATUS_PLAYED, CATEGORY_LABELS } from "@/lib/constants";
import ResetDataButton from "./ResetDataButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
	noStore();
	const stats = await getStats();
	const totalPlayers = stats.players[CATEGORY_MALE] + stats.players[CATEGORY_FEMALE];
	const totalMatches = stats.matches[STATUS_PENDING] + stats.matches[STATUS_PLAYED];

	return (
		<div className="grid gap-5">
			{/* Stats grid */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="glass rounded-2xl p-5 text-center">
					<Users className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{totalPlayers}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugadores</div>
					<div className="mt-0.5 text-xs text-muted-foreground/70">{stats.players[CATEGORY_MALE]} {CATEGORY_LABELS[CATEGORY_MALE].short} / {stats.players[CATEGORY_FEMALE]} {CATEGORY_LABELS[CATEGORY_FEMALE].short}</div>
				</div>
				<div className="glass rounded-2xl p-5 text-center">
					<CalendarDays className="mx-auto mb-2 h-5 w-5 text-foreground" />
					<div className="font-display text-3xl font-bold text-foreground">{totalMatches}</div>
					<div className="mt-1 text-sm text-muted-foreground">Total Partidos</div>
				</div>
				<div className="glass rounded-2xl p-5 text-center">
					<Clock className="mx-auto mb-2 h-5 w-5 text-accent" />
					<div className="font-display text-3xl font-bold text-accent">{stats.matches[STATUS_PENDING]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Pendientes</div>
				</div>
				<div className="glass rounded-2xl p-5 text-center">
					<CheckCircle className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{stats.matches[STATUS_PLAYED]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugados</div>
				</div>
			</div>

			{/* Quick actions */}
			<div className="glass rounded-2xl p-5">
				<h2 className="mb-3 text-lg font-bold text-foreground">Acciones Rapidas</h2>
				<div className="flex flex-wrap gap-3">
					<a
						href="/admin/jugadores"
						className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
					>
						Gestionar Jugadores
					</a>
					<a
						href="/admin/resultados"
						className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
					>
						Registrar Resultados
					</a>
					<ResetDataButton />
				</div>
			</div>
		</div>
	);
}
