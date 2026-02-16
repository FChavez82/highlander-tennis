/**
 * /admin/logs — Audit log viewer with paginated glass-styled table.
 *
 * Shows every admin action recorded: who did it, when, what changed.
 * Pagination via ?page=N query param, 50 entries per page.
 */
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getAuditLogs, type AuditLog } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

/** Human-readable labels for each action type */
const ACTION_LABELS: Record<string, string> = {
	create_player: "Crear jugador",
	delete_player: "Eliminar jugador",
	update_match: "Actualizar partido",
	reset_match: "Resetear partido",
	delete_match: "Eliminar partido",
	generate_round_robin: "Generar round robin",
	generate_bracket: "Generar llaves",
	reset_data: "Reiniciar datos",
};

/** Badge colour per entity type */
const ENTITY_BADGE: Record<string, string> = {
	player: "bg-primary/20 text-primary",
	match: "bg-accent/20 text-accent",
	system: "bg-destructive/20 text-destructive",
};

/**
 * Build a short human-readable summary of prev → new values.
 */
function formatDetails(log: AuditLog): string {
	const parts: string[] = [];

	if (log.prev_values) {
		const prev = log.prev_values;
		/* Show the most relevant fields */
		if (prev.name) parts.push(`${prev.name}`);
		if (prev.score) parts.push(`score: ${prev.score}`);
		if (prev.category) parts.push(`cat: ${prev.category}`);
	}

	if (log.new_values) {
		const next = log.new_values;
		if (next.name) parts.push(`${next.name}`);
		if (next.score !== undefined) parts.push(`score: ${next.score ?? "—"}`);
		if (next.category) parts.push(`cat: ${next.category}`);
		if (next.count !== undefined) parts.push(`${next.count} partidos`);
		if (next.type) parts.push(`tipo: ${next.type}`);
		if (next.action) parts.push(`${next.action}`);
	}

	return parts.join(" | ") || "—";
}

/**
 * Format a timestamp to a compact locale string.
 */
function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString("es-MX", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const LIMIT = 50;

export default async function AuditLogsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	noStore();

	const { page: pageParam } = await searchParams;
	const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
	const { logs, total } = await getAuditLogs(page, LIMIT);
	const totalPages = Math.max(1, Math.ceil(total / LIMIT));

	return (
		<div className="grid gap-5">
			<div className="glass rounded-2xl p-5">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-bold text-foreground">
						Registro de Actividad
					</h2>
					<span className="text-xs text-muted-foreground">
						{total} {total === 1 ? "entrada" : "entradas"}
					</span>
				</div>

				{logs.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No hay registros de actividad todavia.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-border/30 text-xs uppercase tracking-wider text-muted-foreground">
									<th className="px-3 py-2">Fecha</th>
									<th className="px-3 py-2">Admin</th>
									<th className="px-3 py-2">Accion</th>
									<th className="px-3 py-2">Entidad</th>
									<th className="px-3 py-2">Detalles</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log) => (
									<tr
										key={log.id}
										className="border-b border-border/10 transition-colors hover:bg-[hsl(210_20%_80%/0.04)]"
									>
										<td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
											{formatDate(log.created_at)}
										</td>
										<td className="px-3 py-2.5 text-xs">
											{log.admin_email}
										</td>
										<td className="px-3 py-2.5">
											<span className="text-xs font-medium">
												{ACTION_LABELS[log.action] ?? log.action}
											</span>
										</td>
										<td className="px-3 py-2.5">
											<span
												className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${ENTITY_BADGE[log.entity_type] ?? "bg-muted text-muted-foreground"}`}
											>
												{log.entity_type}
												{log.entity_id ? ` #${log.entity_id}` : ""}
											</span>
										</td>
										<td className="max-w-xs truncate px-3 py-2.5 text-xs text-muted-foreground">
											{formatDetails(log)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination controls */}
				{totalPages > 1 && (
					<div className="mt-4 flex items-center justify-center gap-3">
						{page > 1 ? (
							<Link
								href={`/admin/logs?page=${page - 1}`}
								className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-[hsl(210_20%_80%/0.12)] glass-interactive"
							>
								<ChevronLeft className="h-3.5 w-3.5" />
								Anterior
							</Link>
						) : (
							<span className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground/40">
								<ChevronLeft className="h-3.5 w-3.5" />
								Anterior
							</span>
						)}

						<span className="text-xs text-muted-foreground">
							Pagina {page} de {totalPages}
						</span>

						{page < totalPages ? (
							<Link
								href={`/admin/logs?page=${page + 1}`}
								className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-[hsl(210_20%_80%/0.12)] glass-interactive"
							>
								Siguiente
								<ChevronRight className="h-3.5 w-3.5" />
							</Link>
						) : (
							<span className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground/40">
								Siguiente
								<ChevronRight className="h-3.5 w-3.5" />
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
