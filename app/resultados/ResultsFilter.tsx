"use client";

/**
 * ResultsFilter — Swiss-format results viewer.
 *
 * Swiss phase:
 *   - Category pills (M / F)
 *   - Round pills derived from schedule weeks (week_id → round number)
 *   - Match cards for the selected round + category
 *   - Cumulative standings table through the selected round
 *
 * Bracket phase (shown only when bracket matches exist):
 *   - Existing semi/final/3rd-place tree view
 *
 * If no schedule weeks exist (legacy / pre-scheduler data), matches are
 * shown as a flat list without round tabs.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Match, ScheduleWeek } from "@/lib/db";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	STATUS_PLAYED,
	BRACKET_ROUND_SEMIFINAL,
	BRACKET_ROUND_FINAL,
	BRACKET_ROUND_THIRD_PLACE,
	BRACKET_ROUND_LABELS,
	categoryBadgeClass,
	type Category,
	type BracketRound,
} from "@/lib/constants";
import { parseSets, getWinner, countSets } from "@/lib/score";
import { safeDate, isRecent } from "@/lib/utils";

/* ── Shared pill styles ── */

const pillBase =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const pillActive =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

const phaseTabBase =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const phaseTabActive =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

/* ── Internal type for client-side standings ── */

interface SwissRecord {
	id: number;
	name: string;
	wins: number;
	losses: number;
	setsWon: number;
	setsLost: number;
}

/**
 * Compute cumulative standings from a list of matches for one category.
 * Uses parseSets + getWinner from @/lib/score so logic is consistent
 * with the DB-side determineWinner used by admin actions.
 */
function computeStandings(matches: Match[], category: Category): SwissRecord[] {
	const records = new Map<number, SwissRecord>();

	const ensure = (id: number, name: string) => {
		if (!records.has(id)) {
			records.set(id, { id, name, wins: 0, losses: 0, setsWon: 0, setsLost: 0 });
		}
	};

	for (const m of matches) {
		/* Only count played matches in the right category with a valid score */
		if (m.category !== category || !m.score || !m.player_a_id || !m.player_b_id) continue;
		if (!m.player_a_name || !m.player_b_name) continue;

		ensure(m.player_a_id, m.player_a_name);
		ensure(m.player_b_id, m.player_b_name);

		const sets = parseSets(m.score);
		const winner = getWinner(sets);
		const { aSets, bSets } = countSets(m.score);

		if (winner === "a") {
			records.get(m.player_a_id)!.wins++;
			records.get(m.player_b_id)!.losses++;
		} else if (winner === "b") {
			records.get(m.player_b_id)!.wins++;
			records.get(m.player_a_id)!.losses++;
		}

		records.get(m.player_a_id)!.setsWon += aSets;
		records.get(m.player_a_id)!.setsLost += bSets;
		records.get(m.player_b_id)!.setsWon += bSets;
		records.get(m.player_b_id)!.setsLost += aSets;
	}

	/* Sort: wins desc → set diff desc → name asc */
	return Array.from(records.values()).sort((a, b) => {
		if (b.wins !== a.wins) return b.wins - a.wins;
		const diffA = a.setsWon - a.setsLost;
		const diffB = b.setsWon - b.setsLost;
		if (diffB !== diffA) return diffB - diffA;
		return a.name.localeCompare(b.name, "es");
	});
}

/* ── Round descriptor ── */

interface Round {
	weekId: number | null;
	roundNum: number;
	label: string;
	matches: Match[];
}

/** Build an ordered list of rounds from swiss matches + schedule weeks. */
function buildRounds(swissMatches: Match[], weeks: ScheduleWeek[]): Round[] {
	/* Sort weeks by week_number so round indices are chronological */
	const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);

	/* Group matches by week_id (null = no week assigned) */
	const byWeek = new Map<number | null, Match[]>();
	for (const m of swissMatches) {
		const key = m.week_id ?? null;
		if (!byWeek.has(key)) byWeek.set(key, []);
		byWeek.get(key)!.push(m);
	}

	const rounds: Round[] = [];

	/* Add week-linked rounds in chronological order */
	for (let i = 0; i < sortedWeeks.length; i++) {
		const week = sortedWeeks[i];
		const matches = byWeek.get(week.id) ?? [];
		if (matches.length > 0) {
			rounds.push({ weekId: week.id, roundNum: i + 1, label: `Ronda ${i + 1}`, matches });
		}
	}

	/* Append any unlinked matches (week_id = null) as a trailing group */
	const nullMatches = byWeek.get(null) ?? [];
	if (nullMatches.length > 0) {
		rounds.push({
			weekId: null,
			roundNum: rounds.length + 1,
			label: rounds.length === 0 ? "Resultados" : "Sin ronda",
			matches: nullMatches,
		});
	}

	return rounds;
}

/* ── Main component ── */

export default function ResultsFilter({
	swissMatches,
	bracketMatches,
	weeks,
}: {
	swissMatches: Match[];
	bracketMatches: Match[];
	weeks: ScheduleWeek[];
}) {
	const hasBracket = bracketMatches.length > 0;

	/* Phase: "swiss" or "bracket" */
	const [phase, setPhase] = useState<"swiss" | "bracket">("swiss");

	/* Category filter */
	const [category, setCategory] = useState<Category>(CATEGORY_MALE);

	/* Active round index */
	const [activeRoundIdx, setActiveRoundIdx] = useState(0);

	/* Build rounds (memoised — props are stable server-fetched data) */
	const rounds = useMemo(
		() => buildRounds(swissMatches, weeks),
		[swissMatches, weeks]
	);

	/* Clamp active round to valid range */
	const safeIdx = Math.min(activeRoundIdx, Math.max(0, rounds.length - 1));
	const activeRound = rounds[safeIdx] ?? null;

	/* Matches for the active round + selected category */
	const roundMatches = useMemo(
		() => activeRound?.matches.filter((m) => m.category === category) ?? [],
		[activeRound, category]
	);

	/* All matches up to and including the active round — for cumulative standings */
	const matchesUpToRound = useMemo(() => {
		const ids = new Set<number>();
		for (let i = 0; i <= safeIdx; i++) {
			rounds[i]?.matches.forEach((m) => ids.add(m.id));
		}
		return swissMatches.filter((m) => ids.has(m.id));
	}, [swissMatches, rounds, safeIdx]);

	/* Cumulative standings for the selected category through this round */
	const standings = useMemo(
		() => computeStandings(matchesUpToRound, category),
		[matchesUpToRound, category]
	);

	const handleCategoryChange = (cat: Category) => {
		setCategory(cat);
		/* Reset to the first round when switching category to avoid empty state confusion */
		setActiveRoundIdx(0);
	};

	return (
		<>
			{/* Phase tabs — only shown when bracket matches exist */}
			{hasBracket && (
				<div className="flex gap-2">
					<button
						onClick={() => setPhase("swiss")}
						className={phase === "swiss" ? phaseTabActive : phaseTabBase}
					>
						Sistema Suizo
					</button>
					<button
						onClick={() => setPhase("bracket")}
						className={phase === "bracket" ? phaseTabActive : phaseTabBase}
					>
						Cuadro Final
					</button>
				</div>
			)}

			{/* ── Swiss phase ── */}
			{phase === "swiss" && (
				<>
					{/* Category pills + round pills in one row */}
					<div className="flex flex-wrap items-center gap-3">
						{([CATEGORY_MALE, CATEGORY_FEMALE] as const).map((cat) => (
							<button
								key={cat}
								onClick={() => handleCategoryChange(cat)}
								aria-pressed={category === cat}
								className={category === cat ? pillActive : pillBase}
							>
								{CATEGORY_LABELS[cat].full}
							</button>
						))}

						{/* Divider — only when there are multiple rounds */}
						{rounds.length > 0 && (
							<div className="hidden h-6 w-px bg-border sm:block" />
						)}

						{/* Round pills */}
						{rounds.map((round, idx) => (
							<button
								key={round.weekId ?? "null"}
								onClick={() => setActiveRoundIdx(idx)}
								aria-pressed={safeIdx === idx}
								className={safeIdx === idx ? pillActive : pillBase}
							>
								{round.label}
							</button>
						))}
					</div>

					{/* No matches at all */}
					{rounds.length === 0 && (
						<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
							No hay resultados disponibles.
						</div>
					)}

					{/* Match cards for the selected round + category */}
					{rounds.length > 0 && roundMatches.length === 0 && (
						<div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">
							No hay partidos jugados en {activeRound?.label} para {CATEGORY_LABELS[category].full}.
						</div>
					)}

					{roundMatches.length > 0 && (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
							{roundMatches.map((match) => (
								<ResultCard key={match.id} match={match} />
							))}
						</div>
					)}

					{/* Cumulative standings table */}
					{standings.length > 0 && (
						<div className="glass rounded-2xl p-5">
							<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
								Tabla tras {activeRound?.label ?? "esta ronda"} — {CATEGORY_LABELS[category].full}
							</h2>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border/40">
											<th className="text-left py-2 pr-2 text-xs text-muted-foreground font-semibold w-6">#</th>
											<th className="text-left py-2 pr-3 text-xs text-muted-foreground font-semibold">Jugador</th>
											<th className="text-center py-2 px-2 text-xs text-muted-foreground font-semibold">G</th>
											<th className="text-center py-2 px-2 text-xs text-muted-foreground font-semibold">P</th>
											<th className="text-center py-2 px-2 text-xs text-muted-foreground font-semibold">SG</th>
											<th className="text-center py-2 px-2 text-xs text-muted-foreground font-semibold">SP</th>
											<th className="text-center py-2 px-2 text-xs text-muted-foreground font-semibold">+/-</th>
										</tr>
									</thead>
									<tbody>
										{standings.map((rec, i) => {
											const diff = rec.setsWon - rec.setsLost;
											return (
												<tr
													key={rec.id}
													className="border-b border-border/20 last:border-0 hover:bg-[hsl(210_20%_16%/0.3)] transition-colors"
												>
													<td className="py-2 pr-2 text-muted-foreground text-xs">{i + 1}</td>
													<td className="py-2 pr-3 text-foreground">{rec.name}</td>
													<td className="py-2 px-2 text-center text-teal-400 font-bold">{rec.wins}</td>
													<td className="py-2 px-2 text-center text-rose-400">{rec.losses}</td>
													<td className="py-2 px-2 text-center text-muted-foreground">{rec.setsWon}</td>
													<td className="py-2 px-2 text-center text-muted-foreground">{rec.setsLost}</td>
													<td
														className={`py-2 px-2 text-center font-semibold ${
															diff > 0
																? "text-teal-400"
																: diff < 0
																? "text-rose-400"
																: "text-muted-foreground"
														}`}
													>
														{diff > 0 ? `+${diff}` : diff}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							<p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
								Acumulado desde Ronda 1. Orden: victorias → diferencia de sets → nombre.
								G/P = partidos. SG/SP = sets.
							</p>
						</div>
					)}
				</>
			)}

			{/* ── Bracket phase ── */}
			{phase === "bracket" && (
				<BracketView matches={bracketMatches} />
			)}
		</>
	);
}

/* ── Result Card ── */

function ResultCard({ match }: { match: Match }) {
	const sets = parseSets(match.score || "");
	const winner = sets.length > 0 ? getWinner(sets) : null;

	return (
		<div className="glass rounded-2xl p-3 transition-shadow hover:glass-glow-primary">
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<span
					className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${categoryBadgeClass(match.category)}`}
				>
					{CATEGORY_LABELS[match.category].full}
				</span>
				{match.date_played && (
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{safeDate(match.date_played).toLocaleDateString("es-ES", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
						{isRecent(match.date_played) && (
							<span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase leading-none text-accent ring-1 ring-accent/25">
								Nuevo
							</span>
						)}
					</span>
				)}
			</div>

			<div className="overflow-x-auto">
				<div
					className="inline-grid items-center gap-x-2 gap-y-1"
					style={{
						gridTemplateColumns: `minmax(0, max-content) repeat(${sets.length}, 2.25rem)`,
					}}
				>
					<div />
					{sets.map((s, i) => (
						<div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
							{s.isTiebreak ? "ST" : `S${i + 1}`}
						</div>
					))}

					<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
						<Link
							href={`/jugadores/${match.player_a_id}`}
							className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
						>
							{match.player_a_name}
						</Link>
						{winner === "a" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					</div>
					{sets.map((s, i) => (
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

					<div className="flex items-center gap-1 pr-1 max-w-[10rem]">
						<Link
							href={`/jugadores/${match.player_b_id}`}
							className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
						>
							{match.player_b_name}
						</Link>
						{winner === "b" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					</div>
					{sets.map((s, i) => (
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
		</div>
	);
}

/* ── Bracket View (Phase 2) — unchanged ── */

function BracketMatchNode({ match, roundLabel }: { match: Match; roundLabel: string }) {
	const sets = parseSets(match.score || "");
	const winner = sets.length > 0 ? getWinner(sets) : null;
	const isPlayed = match.status === STATUS_PLAYED && match.score;

	return (
		<div className="glass rounded-2xl p-3 w-full min-w-[14rem]">
			<div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
				{roundLabel}
			</div>

			<div
				className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
					winner === "a" ? "bg-primary/10" : ""
				}`}
			>
				<div className="flex items-center gap-1.5 min-w-0">
					{winner === "a" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					{match.player_a_name ? (
						<Link
							href={`/jugadores/${match.player_a_id}`}
							className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
						>
							{match.player_a_name}
						</Link>
					) : (
						<span className="truncate text-sm font-semibold text-muted-foreground">Por definir</span>
					)}
				</div>
				{isPlayed && (
					<span className="flex-shrink-0 text-xs font-bold text-muted-foreground">
						{sets.map((s) => s.a).join(" ")}
					</span>
				)}
			</div>

			<div className="mx-2 my-0.5 border-t border-border/50" />

			<div
				className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
					winner === "b" ? "bg-primary/10" : ""
				}`}
			>
				<div className="flex items-center gap-1.5 min-w-0">
					{winner === "b" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					{match.player_b_name ? (
						<Link
							href={`/jugadores/${match.player_b_id}`}
							className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
						>
							{match.player_b_name}
						</Link>
					) : (
						<span className="truncate text-sm font-semibold text-muted-foreground">Por definir</span>
					)}
				</div>
				{isPlayed && (
					<span className="flex-shrink-0 text-xs font-bold text-muted-foreground">
						{sets.map((s) => s.b).join(" ")}
					</span>
				)}
			</div>

			{isPlayed && (
				<div className="mt-1.5 text-center text-xs font-semibold text-primary">
					{match.score}
				</div>
			)}
			{!isPlayed && (
				<div className="mt-1.5 text-center text-[10px] font-semibold text-muted-foreground">
					Pendiente
				</div>
			)}
		</div>
	);
}

function BracketView({ matches }: { matches: Match[] }) {
	const [categoryFilter, setCategoryFilter] = useState<Category>(CATEGORY_MALE);

	const catMatches = matches.filter((m) => m.category === categoryFilter);
	const semis = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_SEMIFINAL);
	const finals = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_FINAL);
	const thirdPlace = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_THIRD_PLACE);

	return (
		<div className="grid gap-4">
			<div className="flex gap-2">
				{([CATEGORY_MALE, CATEGORY_FEMALE] as const).map((cat) => (
					<button
						key={cat}
						onClick={() => setCategoryFilter(cat)}
						className={categoryFilter === cat ? pillActive : pillBase}
					>
						{CATEGORY_LABELS[cat].full}
					</button>
				))}
			</div>

			{catMatches.length === 0 ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay llaves generadas para esta categoría.
				</div>
			) : (
				<>
					<div className="hidden md:block">
						<DesktopBracket semis={semis} finals={finals} thirdPlace={thirdPlace} />
					</div>
					<div className="md:hidden">
						<MobileBracket semis={semis} finals={finals} thirdPlace={thirdPlace} />
					</div>
				</>
			)}
		</div>
	);
}

function DesktopBracket({
	semis,
	finals,
	thirdPlace,
}: {
	semis: Match[];
	finals: Match[];
	thirdPlace: Match[];
}) {
	return (
		<div className="grid gap-8">
			<div className="flex items-center gap-0">
				<div className="flex flex-col gap-6 w-[16rem]">
					{semis.map((match, i) => (
						<BracketMatchNode
							key={match.id}
							match={match}
							roundLabel={`${BRACKET_ROUND_LABELS[BRACKET_ROUND_SEMIFINAL]} ${i + 1}`}
						/>
					))}
				</div>

				<div className="flex flex-col items-center w-12 self-stretch">
					<svg className="w-full h-full" viewBox="0 0 48 200" preserveAspectRatio="none">
						<line x1="0" y1="25%" x2="50%" y2="25%" stroke="currentColor" strokeWidth="2" className="text-border" />
						<line x1="50%" y1="25%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" />
						<line x1="0" y1="75%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" />
						<line x1="50%" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="2" className="text-border" />
					</svg>
				</div>

				<div className="flex items-center w-[16rem]">
					{finals[0] && (
						<BracketMatchNode
							match={finals[0]}
							roundLabel={BRACKET_ROUND_LABELS[BRACKET_ROUND_FINAL]}
						/>
					)}
				</div>
			</div>

			{thirdPlace[0] && (
				<div className="w-[16rem]">
					<BracketMatchNode
						match={thirdPlace[0]}
						roundLabel={BRACKET_ROUND_LABELS[BRACKET_ROUND_THIRD_PLACE]}
					/>
				</div>
			)}
		</div>
	);
}

function MobileBracket({
	semis,
	finals,
	thirdPlace,
}: {
	semis: Match[];
	finals: Match[];
	thirdPlace: Match[];
}) {
	return (
		<div className="grid gap-3">
			{semis.map((match, i) => (
				<BracketMatchNode
					key={match.id}
					match={match}
					roundLabel={`${BRACKET_ROUND_LABELS[BRACKET_ROUND_SEMIFINAL]} ${i + 1}`}
				/>
			))}

			<div className="flex justify-center text-muted-foreground">
				<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M12 5v14M5 12l7 7 7-7" />
				</svg>
			</div>

			{finals[0] && (
				<BracketMatchNode
					match={finals[0]}
					roundLabel={BRACKET_ROUND_LABELS[BRACKET_ROUND_FINAL]}
				/>
			)}

			{thirdPlace[0] && (
				<BracketMatchNode
					match={thirdPlace[0]}
					roundLabel={BRACKET_ROUND_LABELS[BRACKET_ROUND_THIRD_PLACE]}
				/>
			)}
		</div>
	);
}
