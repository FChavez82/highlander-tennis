"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, RotateCcw, Trash2, X } from "lucide-react";
import type { Match } from "@/lib/db";
import { CATEGORY_MALE, CATEGORY_LABELS } from "@/lib/constants";

/* ── Per-set score entry state ── */
type SetScores = {
	s1a: string; s1b: string;
	s2a: string; s2b: string;
	s3a: string; s3b: string;
	isSuperTiebreak: boolean;
};

const emptyScores: SetScores = {
	s1a: "", s1b: "", s2a: "", s2b: "", s3a: "", s3b: "", isSuperTiebreak: false,
};

/** Parse a score string like "6-4, 3-6, [10-7]" back into individual cells */
function parseScore(score: string): SetScores {
	if (!score) return { ...emptyScores };
	const sets = score.split(",").map((s) => s.trim());
	const result = { ...emptyScores };

	for (let i = 0; i < sets.length; i++) {
		const tbMatch = sets[i].match(/\[(\d+)-(\d+)\]/);
		if (tbMatch) {
			result.s3a = tbMatch[1];
			result.s3b = tbMatch[2];
			result.isSuperTiebreak = true;
			continue;
		}
		const parts = sets[i].split("-").map((n) => n.trim());
		if (parts.length === 2) {
			if (i === 0) { result.s1a = parts[0]; result.s1b = parts[1]; }
			else if (i === 1) { result.s2a = parts[0]; result.s2b = parts[1]; }
			else { result.s3a = parts[0]; result.s3b = parts[1]; }
		}
	}
	return result;
}

/** Assemble individual set cells back into score string */
function buildScore(s: SetScores): string {
	const parts: string[] = [];
	if (s.s1a && s.s1b) parts.push(`${s.s1a}-${s.s1b}`);
	if (s.s2a && s.s2b) parts.push(`${s.s2a}-${s.s2b}`);
	if (s.s3a && s.s3b) {
		parts.push(s.isSuperTiebreak ? `[${s.s3a}-${s.s3b}]` : `${s.s3a}-${s.s3b}`);
	}
	return parts.join(", ");
}

/** Glass input style for score boxes */
const scoreInputClass =
	"h-11 w-11 rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] text-center font-mono text-base font-bold text-foreground outline-none transition-colors focus:border-ring";

/**
 * Admin results management — v0 glass design.
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
	const [editingId, setEditingId] = useState<number | null>(null);
	const [sets, setSets] = useState<SetScores>(emptyScores);
	const [datePlayed, setDatePlayed] = useState("");
	const [saving, setSaving] = useState(false);

	function startEdit(match: Match) {
		setEditingId(match.id);
		setSets(parseScore(match.score || ""));
		setDatePlayed(match.date_played || new Date().toISOString().split("T")[0]);
		setMessage("");
	}

	function cancelEdit() {
		setEditingId(null);
		setSets(emptyScores);
		setDatePlayed("");
	}

	/** Check if sets are split 1-1, meaning a 3rd set is needed */
	function needsThirdSet(): boolean {
		const a1 = parseInt(sets.s1a), b1 = parseInt(sets.s1b);
		const a2 = parseInt(sets.s2a), b2 = parseInt(sets.s2b);
		if (isNaN(a1) || isNaN(b1) || isNaN(a2) || isNaN(b2)) return false;
		const playerAWins = (a1 > b1 ? 1 : 0) + (a2 > b2 ? 1 : 0);
		const playerBWins = (b1 > a1 ? 1 : 0) + (b2 > a2 ? 1 : 0);
		return playerAWins === 1 && playerBWins === 1;
	}

	/** Update a single cell in the sets state */
	function updateSet(field: keyof SetScores, value: string | boolean) {
		setSets((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSave(matchId: number) {
		const score = buildScore(sets);
		if (!score || !datePlayed) return;
		setSaving(true);
		setMessage("");

		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ score: score.trim(), date_played: datePlayed }),
			});
			if (res.ok) {
				setMessage("Resultado guardado.");
				cancelEdit();
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		} finally {
			setSaving(false);
		}
	}

	async function handleReset(matchId: number) {
		if (!confirm("Borrar el resultado y marcar como pendiente?")) return;
		try {
			const res = await fetch(`/api/matches/${matchId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reset: true }),
			});
			if (res.ok) {
				setMessage("Resultado borrado.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		}
	}

	async function handleDelete(matchId: number) {
		if (!confirm("Eliminar este partido permanentemente?")) return;
		try {
			const res = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
			if (res.ok) {
				setMessage("Partido eliminado.");
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		}
	}

	return (
		<div className="grid gap-5">
			{message && (
				<div
					className={`rounded-lg border px-3 py-2.5 text-sm ${
						message.startsWith("Error")
							? "border-destructive/25 bg-destructive/10 text-destructive"
							: "border-primary/25 bg-primary/10 text-primary"
					}`}
				>
					{message}
				</div>
			)}

			{/* Pending matches */}
			<div className="glass rounded-2xl p-5">
				<h2 className="mb-3 text-lg font-bold text-accent">
					Pendientes ({initialPending.length})
				</h2>

				{initialPending.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						No hay partidos pendientes.
					</div>
				) : (
					<div className="grid gap-2">
						{initialPending.map((match) => (
							<div key={match.id} className="glass-light rounded-xl p-3">
								<div className="flex flex-wrap items-center gap-2">
									<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
										<b className="text-foreground">{match.player_a_name}</b>
										<span className="text-xs text-muted-foreground">vs</span>
										<b className="text-foreground">{match.player_b_name}</b>
										<span
											className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
												match.category === CATEGORY_MALE
													? "bg-primary/15 text-primary ring-primary/25"
													: "bg-accent/15 text-accent ring-accent/25"
											}`}
										>
											{CATEGORY_LABELS[match.category].short}
										</span>
									</div>
									{editingId === match.id ? (
										<button
											onClick={cancelEdit}
											className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
										>
											<X className="h-3.5 w-3.5" />
											Cancelar
										</button>
									) : (
										<button
											onClick={() => startEdit(match)}
											className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30 transition-colors"
										>
											<Edit className="h-3.5 w-3.5" />
											Ingresar
										</button>
									)}
								</div>

								{editingId === match.id && (
									<ScoreEditor
										sets={sets}
										updateSet={updateSet}
										needsThirdSet={needsThirdSet()}
										datePlayed={datePlayed}
										setDatePlayed={setDatePlayed}
										onSave={() => handleSave(match.id)}
										saving={saving}
										playerAName={match.player_a_name || "Jugador A"}
										playerBName={match.player_b_name || "Jugador B"}
									/>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Played matches */}
			<div className="glass rounded-2xl p-5">
				<h2 className="mb-3 text-lg font-bold text-primary">
					Jugados ({initialPlayed.length})
				</h2>

				{initialPlayed.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						No hay partidos completados.
					</div>
				) : (
					<div className="grid gap-2">
						{initialPlayed.map((match) => (
							<div key={match.id} className="glass-light rounded-xl p-3">
								<div className="flex flex-wrap items-center gap-2">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<b className="text-foreground">{match.player_a_name}</b>
											<span className="text-xs text-muted-foreground">vs</span>
											<b className="text-foreground">{match.player_b_name}</b>
											<span
												className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
													match.category === CATEGORY_MALE
														? "bg-primary/15 text-primary ring-primary/25"
														: "bg-accent/15 text-accent ring-accent/25"
												}`}
											>
												{CATEGORY_LABELS[match.category].short}
											</span>
										</div>
										<div className="mt-1">
											<span className="font-mono text-sm font-extrabold text-primary">
												{match.score}
											</span>
											{match.date_played && (
												<span className="ml-2 text-xs text-muted-foreground">
													{new Date(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
												</span>
											)}
										</div>
									</div>

									<div className="flex flex-shrink-0 gap-1.5">
										{editingId === match.id ? (
											<button
												onClick={cancelEdit}
												className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										) : (
											<button
												onClick={() => startEdit(match)}
												className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
											>
												<Edit className="h-3.5 w-3.5" />
											</button>
										)}
										<button
											onClick={() => handleReset(match.id)}
											className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1.5 text-xs text-accent transition-colors hover:bg-accent/20"
										>
											<RotateCcw className="h-3.5 w-3.5" />
										</button>
										<button
											onClick={() => handleDelete(match.id)}
											className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/20"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>

								{editingId === match.id && (
									<ScoreEditor
										sets={sets}
										updateSet={updateSet}
										needsThirdSet={needsThirdSet()}
										datePlayed={datePlayed}
										setDatePlayed={setDatePlayed}
										onSave={() => handleSave(match.id)}
										saving={saving}
										playerAName={match.player_a_name || "Jugador A"}
										playerBName={match.player_b_name || "Jugador B"}
									/>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

/* ── Shared score-entry grid component ── */
function ScoreEditor({
	sets,
	updateSet,
	needsThirdSet,
	datePlayed,
	setDatePlayed,
	onSave,
	saving,
	playerAName,
	playerBName,
}: {
	sets: SetScores;
	updateSet: (field: keyof SetScores, value: string | boolean) => void;
	needsThirdSet: boolean;
	datePlayed: string;
	setDatePlayed: (v: string) => void;
	onSave: () => void;
	saving: boolean;
	playerAName: string;
	playerBName: string;
}) {
	/* Show 3rd set if sets are 1-1 OR if user already entered 3rd set values */
	const showThird = needsThirdSet || !!(sets.s3a || sets.s3b);

	return (
		<div className="mt-3 grid gap-2.5">
			{/* Score grid — scrollable on small screens */}
			<div className="overflow-x-auto">
			<div
				className="grid items-center gap-x-2 gap-y-1.5"
				style={{
					gridTemplateColumns: showThird ? "1fr auto auto auto" : "1fr auto auto",
					minWidth: showThird ? "320px" : "260px",
				}}
			>
				{/* Header row */}
				<div />
				<div className="text-center text-xs font-semibold text-muted-foreground">Set 1</div>
				<div className="text-center text-xs font-semibold text-muted-foreground">Set 2</div>
				{showThird && (
					<div className="text-center text-xs font-semibold text-muted-foreground">
						{sets.isSuperTiebreak ? "S. Tie" : "Set 3"}
					</div>
				)}

				{/* Player A row */}
				<div className="truncate text-sm font-semibold text-foreground">
					{playerAName}
				</div>
				<input
					type="number"
					min="0"
					max="7"
					value={sets.s1a}
					onChange={(e) => updateSet("s1a", e.target.value)}
					className={scoreInputClass}
				/>
				<input
					type="number"
					min="0"
					max="7"
					value={sets.s2a}
					onChange={(e) => updateSet("s2a", e.target.value)}
					className={scoreInputClass}
				/>
				{showThird && (
					<input
						type="number"
						min="0"
						max={sets.isSuperTiebreak ? "99" : "7"}
						value={sets.s3a}
						onChange={(e) => updateSet("s3a", e.target.value)}
						className={scoreInputClass}
					/>
				)}

				{/* Player B row */}
				<div className="truncate text-sm font-semibold text-foreground">
					{playerBName}
				</div>
				<input
					type="number"
					min="0"
					max="7"
					value={sets.s1b}
					onChange={(e) => updateSet("s1b", e.target.value)}
					className={scoreInputClass}
				/>
				<input
					type="number"
					min="0"
					max="7"
					value={sets.s2b}
					onChange={(e) => updateSet("s2b", e.target.value)}
					className={scoreInputClass}
				/>
				{showThird && (
					<input
						type="number"
						min="0"
						max={sets.isSuperTiebreak ? "99" : "7"}
						value={sets.s3b}
						onChange={(e) => updateSet("s3b", e.target.value)}
						className={scoreInputClass}
					/>
				)}
			</div>
			</div>

			{/* Super-tiebreak toggle — only visible when 3rd set is shown */}
			{showThird && (
				<label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
					<input
						type="checkbox"
						checked={sets.isSuperTiebreak}
						onChange={(e) => updateSet("isSuperTiebreak", e.target.checked)}
						className="accent-primary"
					/>
					Super Tiebreak (3er set)
				</label>
			)}

			{/* Date + Save */}
			<div className="flex flex-wrap items-center gap-2">
				<input
					type="date"
					value={datePlayed}
					onChange={(e) => setDatePlayed(e.target.value)}
					className="w-auto rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring"
				/>
				<button
					onClick={onSave}
					disabled={saving}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
				>
					{saving ? "..." : "Guardar"}
				</button>
			</div>
		</div>
	);
}
