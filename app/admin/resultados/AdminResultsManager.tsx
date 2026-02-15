"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, RotateCcw, Trash2, Trophy, X, Zap } from "lucide-react";
import type { Match } from "@/lib/db";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	PHASE_ROUND_ROBIN,
	PHASE_BRACKET,
	PHASE_LABELS,
	BRACKET_QUALIFIERS,
	BRACKET_ROUND_SEMIFINAL,
	BRACKET_ROUND_FINAL,
	BRACKET_ROUND_THIRD_PLACE,
	BRACKET_ROUND_LABELS,
	categoryBadgeClass,
	type Category,
	type Phase,
	type BracketRound,
} from "@/lib/constants";

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

/** Parsed set for score display grid */
type ParsedSet = { a: number; b: number; isTiebreak: boolean };

function parseSetsForDisplay(score: string): ParsedSet[] {
	if (!score) return [];
	return score.split(",").map((s) => {
		const trimmed = s.trim();
		const tbMatch = trimmed.match(/\[(\d+)-(\d+)\]/);
		if (tbMatch) {
			return { a: parseInt(tbMatch[1]), b: parseInt(tbMatch[2]), isTiebreak: true };
		}
		const parts = trimmed.split("-").map((n) => parseInt(n.trim()));
		if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
			return { a: parts[0], b: parts[1], isTiebreak: false };
		}
		return null;
	}).filter((s): s is ParsedSet => s !== null);
}

/** Determine winner: "a" if player A won more sets, "b" if player B, null if tie/unknown */
function getWinner(sets: ParsedSet[]): "a" | "b" | null {
	let aWins = 0;
	let bWins = 0;
	for (const s of sets) {
		if (s.a > s.b) aWins++;
		else if (s.b > s.a) bWins++;
	}
	if (aWins > bWins) return "a";
	if (bWins > aWins) return "b";
	return null;
}

/** Parse a date string safely, pinning to noon to avoid timezone day-shift */
function safeDate(d: string | Date): Date {
	const raw = typeof d === "string" ? d : d.toISOString();
	return new Date(raw.slice(0, 10) + "T12:00:00");
}

/** Glass input style for score boxes */
const scoreInputClass =
	"h-11 w-11 rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] text-center font-mono text-base font-bold text-foreground outline-none transition-colors focus:border-ring";

/* ── Phase tab styles ── */
const phaseTabBase =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
const phaseTabActive =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/* ── Category pill styles ── */
const pillBase =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
const pillActive =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/**
 * Admin results management — supports Round Robin (Fase 1) and Bracket (Fase 2).
 */
export default function AdminResultsManager({
	initialPending,
	initialPlayed,
	initialBracketMatches,
}: {
	initialPending: Match[];
	initialPlayed: Match[];
	initialBracketMatches: Match[];
}) {
	const router = useRouter();
	const [phase, setPhase] = useState<Phase>(PHASE_ROUND_ROBIN);
	const [message, setMessage] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [sets, setSets] = useState<SetScores>(emptyScores);
	const [datePlayed, setDatePlayed] = useState("");
	const [saving, setSaving] = useState(false);
	const [generating, setGenerating] = useState(false);

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

	function needsThirdSet(): boolean {
		const a1 = parseInt(sets.s1a), b1 = parseInt(sets.s1b);
		const a2 = parseInt(sets.s2a), b2 = parseInt(sets.s2b);
		if (isNaN(a1) || isNaN(b1) || isNaN(a2) || isNaN(b2)) return false;
		const playerAWins = (a1 > b1 ? 1 : 0) + (a2 > b2 ? 1 : 0);
		const playerBWins = (b1 > a1 ? 1 : 0) + (b2 > a2 ? 1 : 0);
		return playerAWins === 1 && playerBWins === 1;
	}

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

	/** Generate bracket matches from current standings for a given category */
	async function handleGenerateBracket(category: Category) {
		const catLabel = CATEGORY_LABELS[category].full;
		if (!confirm(
			`Generar llaves de eliminación para ${catLabel} con los top ${BRACKET_QUALIFIERS} de la clasificación?\n\n` +
			`Esto reemplazará cualquier llave existente para esta categoría.`
		)) return;

		setGenerating(true);
		setMessage("");
		try {
			const res = await fetch("/api/matches", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "generate_bracket",
					category,
					qualifiers: BRACKET_QUALIFIERS,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				setMessage(data.message);
				router.refresh();
			} else {
				const data = await res.json();
				setMessage(`Error: ${data.error}`);
			}
		} catch {
			setMessage("Error de conexion.");
		} finally {
			setGenerating(false);
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

			{/* Phase tabs */}
			<div className="flex gap-2">
				{([PHASE_ROUND_ROBIN, PHASE_BRACKET] as const).map((p) => (
					<button
						key={p}
						onClick={() => { setPhase(p); cancelEdit(); }}
						className={phase === p ? phaseTabActive : phaseTabBase}
					>
						{PHASE_LABELS[p].short}
					</button>
				))}
			</div>

			{/* ══════════════ Fase 1: Round Robin ══════════════ */}
			{phase === PHASE_ROUND_ROBIN && (
				<>
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
							<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
								{initialPending.map((match) => (
									<PendingMatchCard
										key={match.id}
										match={match}
										editingId={editingId}
										sets={sets}
										updateSet={updateSet}
										needsThirdSet={needsThirdSet()}
										datePlayed={datePlayed}
										setDatePlayed={setDatePlayed}
										saving={saving}
										onStartEdit={startEdit}
										onCancelEdit={cancelEdit}
										onSave={handleSave}
									/>
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
							<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
								{initialPlayed.map((match) => (
									<PlayedMatchCard
										key={match.id}
										match={match}
										editingId={editingId}
										sets={sets}
										updateSet={updateSet}
										needsThirdSet={needsThirdSet()}
										datePlayed={datePlayed}
										setDatePlayed={setDatePlayed}
										saving={saving}
										onStartEdit={startEdit}
										onCancelEdit={cancelEdit}
										onSave={handleSave}
										onReset={handleReset}
										onDelete={handleDelete}
									/>
								))}
							</div>
						)}
					</div>
				</>
			)}

			{/* ══════════════ Fase 2: Bracket ══════════════ */}
			{phase === PHASE_BRACKET && (
				<AdminBracketPhase
					bracketMatches={initialBracketMatches}
					editingId={editingId}
					sets={sets}
					updateSet={updateSet}
					needsThirdSet={needsThirdSet()}
					datePlayed={datePlayed}
					setDatePlayed={setDatePlayed}
					saving={saving}
					generating={generating}
					onStartEdit={startEdit}
					onCancelEdit={cancelEdit}
					onSave={handleSave}
					onReset={handleReset}
					onDelete={handleDelete}
					onGenerateBracket={handleGenerateBracket}
				/>
			)}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════════
   Admin Bracket Phase — bracket management with generate + edit
   ══════════════════════════════════════════════════════════════════ */

function AdminBracketPhase({
	bracketMatches,
	editingId,
	sets,
	updateSet,
	needsThirdSet,
	datePlayed,
	setDatePlayed,
	saving,
	generating,
	onStartEdit,
	onCancelEdit,
	onSave,
	onReset,
	onDelete,
	onGenerateBracket,
}: {
	bracketMatches: Match[];
	editingId: number | null;
	sets: SetScores;
	updateSet: (field: keyof SetScores, value: string | boolean) => void;
	needsThirdSet: boolean;
	datePlayed: string;
	setDatePlayed: (v: string) => void;
	saving: boolean;
	generating: boolean;
	onStartEdit: (match: Match) => void;
	onCancelEdit: () => void;
	onSave: (matchId: number) => void;
	onReset: (matchId: number) => void;
	onDelete: (matchId: number) => void;
	onGenerateBracket: (category: Category) => void;
}) {
	const [categoryFilter, setCategoryFilter] = useState<Category>(CATEGORY_MALE);

	const catMatches = bracketMatches.filter((m) => m.category === categoryFilter);
	const semis = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_SEMIFINAL);
	const finals = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_FINAL);
	const thirdPlace = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_THIRD_PLACE);

	/* Group all bracket matches by round for display */
	const roundOrder: BracketRound[] = [BRACKET_ROUND_SEMIFINAL, BRACKET_ROUND_FINAL, BRACKET_ROUND_THIRD_PLACE];
	const matchesByRound = new Map<BracketRound, Match[]>();
	for (const round of roundOrder) {
		const roundMatches = catMatches.filter((m) => m.bracket_round === round);
		if (roundMatches.length > 0) {
			matchesByRound.set(round, roundMatches);
		}
	}

	return (
		<div className="grid gap-4">
			{/* Category pills + Generate button */}
			<div className="flex flex-wrap items-center gap-3">
				{([CATEGORY_MALE, CATEGORY_FEMALE] as const).map((cat) => (
					<button
						key={cat}
						onClick={() => setCategoryFilter(cat)}
						className={categoryFilter === cat ? pillActive : pillBase}
					>
						{CATEGORY_LABELS[cat].full}
					</button>
				))}

				<div className="hidden h-6 w-px bg-border sm:block" />

				{/* Generate bracket button */}
				<button
					onClick={() => onGenerateBracket(categoryFilter)}
					disabled={generating}
					className="inline-flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/30 disabled:opacity-50"
				>
					<Zap className="h-3.5 w-3.5" />
					{generating ? "Generando..." : "Generar Llaves"}
				</button>
			</div>

			{/* Bracket matches grouped by round */}
			{catMatches.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay llaves generadas para {CATEGORY_LABELS[categoryFilter].full}.
					<br />
					<span className="text-xs">
						Usa el botón &quot;Generar Llaves&quot; para crear las llaves desde la clasificación actual.
					</span>
				</div>
			) : (
				<>
					{Array.from(matchesByRound.entries()).map(([round, matches]) => (
						<div key={round} className="glass rounded-2xl p-5">
							<h2 className="mb-3 text-lg font-bold text-accent">
								{BRACKET_ROUND_LABELS[round]}
							</h2>
							<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
								{matches.map((match) => {
									const isPlayed = match.status === "jugado" && match.score;
									if (isPlayed) {
										return (
											<PlayedMatchCard
												key={match.id}
												match={match}
												editingId={editingId}
												sets={sets}
												updateSet={updateSet}
												needsThirdSet={needsThirdSet}
												datePlayed={datePlayed}
												setDatePlayed={setDatePlayed}
												saving={saving}
												onStartEdit={onStartEdit}
												onCancelEdit={onCancelEdit}
												onSave={onSave}
												onReset={onReset}
												onDelete={onDelete}
											/>
										);
									}
									return (
										<PendingMatchCard
											key={match.id}
											match={match}
											editingId={editingId}
											sets={sets}
											updateSet={updateSet}
											needsThirdSet={needsThirdSet}
											datePlayed={datePlayed}
											setDatePlayed={setDatePlayed}
											saving={saving}
											onStartEdit={onStartEdit}
											onCancelEdit={onCancelEdit}
											onSave={onSave}
										/>
									);
								})}
							</div>
						</div>
					))}
				</>
			)}
		</div>
	);
}

/* ══════════════════════════════════════════════════════════════════
   Shared components
   ══════════════════════════════════════════════════════════════════ */

/** Compact pending match card — matches the public /resultados card style */
function PendingMatchCard({
	match,
	editingId,
	sets,
	updateSet,
	needsThirdSet,
	datePlayed,
	setDatePlayed,
	saving,
	onStartEdit,
	onCancelEdit,
	onSave,
}: {
	match: Match;
	editingId: number | null;
	sets: SetScores;
	updateSet: (field: keyof SetScores, value: string | boolean) => void;
	needsThirdSet: boolean;
	datePlayed: string;
	setDatePlayed: (v: string) => void;
	saving: boolean;
	onStartEdit: (match: Match) => void;
	onCancelEdit: () => void;
	onSave: (matchId: number) => void;
}) {
	return (
		<div className="glass rounded-2xl p-3">
			{/* Top row: category badge + action */}
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<span
					className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${categoryBadgeClass(match.category)}`}
				>
					{CATEGORY_LABELS[match.category].short}
				</span>
				{editingId === match.id ? (
					<button
						onClick={onCancelEdit}
						className="inline-flex items-center gap-1 rounded-lg bg-[hsl(210_20%_80%/0.06)] px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				) : (
					<button
						onClick={() => onStartEdit(match)}
						className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30 transition-colors"
					>
						<Edit className="h-3.5 w-3.5" />
						Ingresar
					</button>
				)}
			</div>

			{/* Player names */}
			<div className="grid gap-1">
				<div className="flex items-center gap-1 max-w-[10rem]">
					<span className="truncate text-sm font-semibold text-foreground">
						{match.player_a_name || "Por definir"}
					</span>
				</div>
				<div className="flex items-center gap-1 max-w-[10rem]">
					<span className="truncate text-sm font-semibold text-foreground">
						{match.player_b_name || "Por definir"}
					</span>
				</div>
			</div>

			{editingId === match.id && (
				<ScoreEditor
					sets={sets}
					updateSet={updateSet}
					needsThirdSet={needsThirdSet}
					datePlayed={datePlayed}
					setDatePlayed={setDatePlayed}
					onSave={() => onSave(match.id)}
					saving={saving}
					playerAName={match.player_a_name || "Jugador A"}
					playerBName={match.player_b_name || "Jugador B"}
				/>
			)}
		</div>
	);
}

/** Compact played match card — matches the public /resultados card style with admin actions */
function PlayedMatchCard({
	match,
	editingId,
	sets,
	updateSet,
	needsThirdSet,
	datePlayed,
	setDatePlayed,
	saving,
	onStartEdit,
	onCancelEdit,
	onSave,
	onReset,
	onDelete,
}: {
	match: Match;
	editingId: number | null;
	sets: SetScores;
	updateSet: (field: keyof SetScores, value: string | boolean) => void;
	needsThirdSet: boolean;
	datePlayed: string;
	setDatePlayed: (v: string) => void;
	saving: boolean;
	onStartEdit: (match: Match) => void;
	onCancelEdit: () => void;
	onSave: (matchId: number) => void;
	onReset: (matchId: number) => void;
	onDelete: (matchId: number) => void;
}) {
	const displaySets = parseSetsForDisplay(match.score || "");
	const winner = displaySets.length > 0 ? getWinner(displaySets) : null;

	return (
		<div className="glass rounded-2xl p-3">
			{/* Top row: category badge + date + action icons */}
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span
						className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${categoryBadgeClass(match.category)}`}
					>
						{CATEGORY_LABELS[match.category].short}
					</span>
					{match.date_played && (
						<span className="text-xs text-muted-foreground">
							{safeDate(match.date_played).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
						</span>
					)}
				</div>
				<div className="flex flex-shrink-0 gap-1">
					{editingId === match.id ? (
						<button
							onClick={onCancelEdit}
							className="inline-flex items-center rounded-md bg-[hsl(210_20%_80%/0.06)] p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					) : (
						<button
							onClick={() => onStartEdit(match)}
							className="inline-flex items-center rounded-md bg-[hsl(210_20%_80%/0.06)] p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
						>
							<Edit className="h-3.5 w-3.5" />
						</button>
					)}
					<button
						onClick={() => onReset(match.id)}
						className="inline-flex items-center rounded-md bg-accent/10 p-1 text-xs text-accent transition-colors hover:bg-accent/20"
					>
						<RotateCcw className="h-3.5 w-3.5" />
					</button>
					<button
						onClick={() => onDelete(match.id)}
						className="inline-flex items-center rounded-md bg-destructive/10 p-1 text-xs text-destructive transition-colors hover:bg-destructive/20"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{/* Score grid — compact, matching /resultados style */}
			<div className="overflow-x-auto">
				<div
					className="inline-grid items-center gap-x-2 gap-y-1"
					style={{
						gridTemplateColumns: `minmax(0, max-content) repeat(${displaySets.length}, 2.25rem)`,
					}}
				>
					{/* Header row */}
					<div />
					{displaySets.map((s, i) => (
						<div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
							{s.isTiebreak ? "ST" : `S${i + 1}`}
						</div>
					))}

					{/* Player A */}
					<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
						<span className="truncate text-sm font-semibold text-foreground">{match.player_a_name}</span>
						{winner === "a" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					</div>
					{displaySets.map((s, i) => (
						<div
							key={i}
							className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-bold ${
								s.a > s.b
									? "bg-primary/15 text-primary ring-1 ring-primary/25"
									: "bg-[hsl(210_20%_80%/0.05)] text-muted-foreground"
							}`}
						>
							{s.a}
						</div>
					))}

					{/* Player B */}
					<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
						<span className="truncate text-sm font-semibold text-foreground">{match.player_b_name}</span>
						{winner === "b" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					</div>
					{displaySets.map((s, i) => (
						<div
							key={i}
							className={`flex h-8 w-9 items-center justify-center rounded-md text-sm font-bold ${
								s.b > s.a
									? "bg-primary/15 text-primary ring-1 ring-primary/25"
									: "bg-[hsl(210_20%_80%/0.05)] text-muted-foreground"
							}`}
						>
							{s.b}
						</div>
					))}
				</div>
			</div>

			{editingId === match.id && (
				<ScoreEditor
					sets={sets}
					updateSet={updateSet}
					needsThirdSet={needsThirdSet}
					datePlayed={datePlayed}
					setDatePlayed={setDatePlayed}
					onSave={() => onSave(match.id)}
					saving={saving}
					playerAName={match.player_a_name || "Jugador A"}
					playerBName={match.player_b_name || "Jugador B"}
				/>
			)}
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
	const showThird = needsThirdSet || !!(sets.s3a || sets.s3b);

	return (
		<div className="mt-3 grid gap-2.5">
			<div className="overflow-x-auto">
			<div
				className="grid items-center gap-x-2 gap-y-1.5"
				style={{
					gridTemplateColumns: showThird ? "1fr auto auto auto" : "1fr auto auto",
					minWidth: showThird ? "320px" : "260px",
				}}
			>
				<div />
				<div className="text-center text-xs font-semibold text-muted-foreground">Set 1</div>
				<div className="text-center text-xs font-semibold text-muted-foreground">Set 2</div>
				{showThird && (
					<div className="text-center text-xs font-semibold text-muted-foreground">
						{sets.isSuperTiebreak ? "S. Tie" : "Set 3"}
					</div>
				)}

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
