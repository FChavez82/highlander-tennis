"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Standing } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/**
 * Admin player management — v0 glass design.
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
	const [category, setCategory] = useState<Category>(CATEGORY_MALE);
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
		<div className="grid gap-5">
			{/* Add player form */}
			<div className="glass rounded-2xl p-5">
				<h2 className="mb-3 text-lg font-bold text-foreground">Agregar Jugador</h2>
				<form onSubmit={handleAdd} className="flex flex-wrap gap-2.5">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre del jugador"
						className="min-w-[200px] flex-1 rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring glass-interactive"
						required
					/>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value as Category)}
						className="cursor-pointer rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] px-4 py-2.5 text-sm text-foreground outline-none glass-interactive"
					>
						<option value={CATEGORY_MALE}>{CATEGORY_LABELS[CATEGORY_MALE].full}</option>
						<option value={CATEGORY_FEMALE}>{CATEGORY_LABELS[CATEGORY_FEMALE].full}</option>
					</select>
					<button
						type="submit"
						disabled={loading}
						className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50 glass-interactive"
					>
						<Plus className="h-4 w-4" />
						{loading ? "Agregando..." : "Agregar"}
					</button>
				</form>
				{message && (
					<div
						className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${
							message.startsWith("Error")
								? "border-destructive/25 bg-destructive/10 text-destructive"
								: "border-primary/25 bg-primary/10 text-primary"
						}`}
					>
						{message}
					</div>
				)}
			</div>

			{/* Player lists */}
			<PlayerList title={CATEGORY_LABELS[CATEGORY_MALE].full} players={initialMasculino} deleteLoading={deleteLoading} onDelete={handleDelete} />
			<PlayerList title={CATEGORY_LABELS[CATEGORY_FEMALE].full} players={initialFemenino} deleteLoading={deleteLoading} onDelete={handleDelete} />
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
		<div className="glass rounded-2xl p-5">
			<h2 className="mb-3 text-lg font-bold text-foreground">{title} ({players.length})</h2>

			{players.length === 0 ? (
				<div className="p-4 text-center text-sm text-muted-foreground">
					No hay jugadores en esta categoria.
				</div>
			) : (
				<div className="grid gap-2">
					{players.map((player) => (
						<div
							key={player.id}
							className="glass-light flex items-center justify-between rounded-xl p-3 transition-shadow hover:glass-glow-primary"
						>
							<div>
								<b className="text-foreground">{player.name}</b>
								<span className="ml-2 text-xs text-muted-foreground">
									{player.played} jugados / {player.pending} pend.
								</span>
							</div>
							<button
								onClick={() => onDelete(player.id, player.name)}
								disabled={deleteLoading === player.id}
								className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50 glass-interactive"
							>
								<Trash2 className="h-3.5 w-3.5" />
								{deleteLoading === player.id ? "..." : "Eliminar"}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
