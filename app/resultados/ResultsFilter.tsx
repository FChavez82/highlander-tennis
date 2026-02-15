"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import type { Match } from "@/lib/db";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	PHASE_ROUND_ROBIN,
	PHASE_BRACKET,
	PHASE_LABELS,
	BRACKET_ROUND_SEMIFINAL,
	BRACKET_ROUND_FINAL,
	BRACKET_ROUND_THIRD_PLACE,
	BRACKET_ROUND_LABELS,
	categoryBadgeClass,
	type Category,
	type Phase,
	type BracketRound,
} from "@/lib/constants";

/* ── Score parsing helpers ── */

type ParsedSet = { a: number; b: number; isTiebreak: boolean };

function parseSets(score: string): ParsedSet[] {
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

function safeDate(d: string | Date): Date {
	const raw = typeof d === "string" ? d : d.toISOString();
	return new Date(raw.slice(0, 10) + "T12:00:00");
}

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

/* ── Pill styles ── */

const pillBase =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
const pillActive =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/* ── Phase tab styles (slightly larger than filter pills) ── */

const phaseTabBase =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground";
const phaseTabActive =
	"rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30";

/**
 * Results display — supports Fase 1 (Round Robin) and Fase 2 (Bracket) tabs.
 */
export default function ResultsFilter({
	roundRobinMatches,
	bracketMatches,
}: {
	roundRobinMatches: Match[];
	bracketMatches: Match[];
}) {
	const [phase, setPhase] = useState<Phase>(PHASE_ROUND_ROBIN);
	const [filter, setFilter] = useState<"all" | Category>("all");
	const [selectedPlayer, setSelectedPlayer] = useState<string>("all");

	/* Build player names from round-robin matches */
	const playerNames = Array.from(
		new Set(
			roundRobinMatches.flatMap((m) => [m.player_a_name, m.player_b_name].filter(Boolean) as string[])
		)
	).sort((a, b) => a.localeCompare(b, "es"));

	/* Apply category and player filters to round-robin */
	const filteredRR = roundRobinMatches.filter((m) => {
		const matchesCategory = filter === "all" || m.category === filter;
		const matchesPlayer =
			selectedPlayer === "all" ||
			m.player_a_name === selectedPlayer ||
			m.player_b_name === selectedPlayer;
		return matchesCategory && matchesPlayer;
	});

	/* Determine if bracket matches exist (to show/hide Fase 2 tab) */
	const hasBracket = bracketMatches.length > 0;

	return (
		<>
			{/* Phase tabs — only show when there are bracket matches */}
			{hasBracket && (
				<div className="flex gap-2">
					{([PHASE_ROUND_ROBIN, PHASE_BRACKET] as const).map((p) => (
						<button
							key={p}
							onClick={() => setPhase(p)}
							className={phase === p ? phaseTabActive : phaseTabBase}
						>
							{PHASE_LABELS[p].short}
						</button>
					))}
				</div>
			)}

			{/* Fase 1: Round Robin results (existing behavior) */}
			{phase === PHASE_ROUND_ROBIN && (
				<>
					{/* Filters row */}
					<div className="flex flex-wrap items-center gap-3">
						{(["all", CATEGORY_MALE, CATEGORY_FEMALE] as const).map((f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={filter === f ? pillActive : pillBase}
							>
								{f === "all" ? "Todos" : CATEGORY_LABELS[f].full}
							</button>
						))}
						<div className="hidden h-6 w-px bg-border sm:block" />
						<select
							value={selectedPlayer}
							onChange={(e) => setSelectedPlayer(e.target.value)}
							className="rounded-lg bg-[hsl(210_20%_80%/0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-primary/30"
						>
							<option value="all">Todos los jugadores</option>
							{playerNames.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
					</div>

					{filteredRR.length === 0 ? (
						<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
							No hay resultados disponibles.
						</div>
					) : (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
							{filteredRR.map((match) => (
								<ResultCard key={match.id} match={match} />
							))}
						</div>
					)}
				</>
			)}

			{/* Fase 2: Bracket visualization */}
			{phase === PHASE_BRACKET && (
				<BracketView matches={bracketMatches} />
			)}
		</>
	);
}

/* ── Result Card (same as before) ── */

function ResultCard({ match }: { match: Match }) {
	const sets = parseSets(match.score || "");
	const winner = sets.length > 0 ? getWinner(sets) : null;

	return (
		<div className="glass rounded-2xl p-3 transition-shadow hover:glass-glow-primary">
			<div className="mb-2.5 flex items-center justify-between gap-2">
				<span
					className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${categoryBadgeClass(match.category)}`}
				>
					{CATEGORY_LABELS[match.category].short}
				</span>
				{match.date_played && (
					<span className="text-xs text-muted-foreground">
						{safeDate(match.date_played).toLocaleDateString("es-ES", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
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
					<span className="truncate text-sm font-semibold text-foreground">{match.player_a_name}</span>
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
					<span className="truncate text-sm font-semibold text-foreground">{match.player_b_name}</span>
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

/* ── Bracket View (Phase 2) ── */

/**
 * Bracket match node — shows two players and score (or "Por definir").
 */
function BracketMatchNode({ match, roundLabel }: { match: Match; roundLabel: string }) {
	const sets = parseSets(match.score || "");
	const winner = sets.length > 0 ? getWinner(sets) : null;
	const isPlayed = match.status === "jugado" && match.score;

	return (
		<div className="glass rounded-2xl p-3 w-full min-w-[14rem]">
			{/* Round label */}
			<div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
				{roundLabel}
			</div>

			{/* Player A */}
			<div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
				winner === "a" ? "bg-primary/10" : ""
			}`}>
				<div className="flex items-center gap-1.5 min-w-0">
					{winner === "a" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					<span className="truncate text-sm font-semibold text-foreground">
						{match.player_a_name || "Por definir"}
					</span>
				</div>
				{isPlayed && (
					<span className="flex-shrink-0 text-xs font-bold text-muted-foreground">
						{sets.map((s) => s.a).join(" ")}
					</span>
				)}
			</div>

			{/* Divider */}
			<div className="mx-2 my-0.5 border-t border-border/50" />

			{/* Player B */}
			<div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
				winner === "b" ? "bg-primary/10" : ""
			}`}>
				<div className="flex items-center gap-1.5 min-w-0">
					{winner === "b" && <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-accent" />}
					<span className="truncate text-sm font-semibold text-foreground">
						{match.player_b_name || "Por definir"}
					</span>
				</div>
				{isPlayed && (
					<span className="flex-shrink-0 text-xs font-bold text-muted-foreground">
						{sets.map((s) => s.b).join(" ")}
					</span>
				)}
			</div>

			{/* Score summary below if played */}
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

/**
 * Bracket visualization — shows semifinals → final + 3rd place for each category.
 */
function BracketView({ matches }: { matches: Match[] }) {
	const [categoryFilter, setCategoryFilter] = useState<Category>(CATEGORY_MALE);

	/* Split matches by category */
	const catMatches = matches.filter((m) => m.category === categoryFilter);

	/* Group by round */
	const semis = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_SEMIFINAL);
	const finals = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_FINAL);
	const thirdPlace = catMatches.filter((m) => m.bracket_round === BRACKET_ROUND_THIRD_PLACE);

	const hasCatMatches = catMatches.length > 0;

	return (
		<div className="grid gap-4">
			{/* Category filter pills */}
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

			{!hasCatMatches ? (
				<div className="glass rounded-2xl p-8 text-center text-muted-foreground">
					No hay llaves generadas para esta categoría.
				</div>
			) : (
				<>
					{/* Desktop: tree layout. Mobile: stacked vertically */}
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

/**
 * Desktop bracket layout — horizontal tree with connector lines.
 *
 * Layout:
 *   [SF1]──┐
 *          ├──[Final]
 *   [SF2]──┘
 *
 *   [3er Puesto]
 */
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
			{/* Main bracket: semis → final */}
			<div className="flex items-center gap-0">
				{/* Semifinals column */}
				<div className="flex flex-col gap-6 w-[16rem]">
					{semis.map((match, i) => (
						<BracketMatchNode
							key={match.id}
							match={match}
							roundLabel={`${BRACKET_ROUND_LABELS[BRACKET_ROUND_SEMIFINAL]} ${i + 1}`}
						/>
					))}
				</div>

				{/* Connector lines between semis and final */}
				<div className="flex flex-col items-center w-12 self-stretch">
					<svg className="w-full h-full" viewBox="0 0 48 200" preserveAspectRatio="none">
						{/* Top semi → middle connector */}
						<line x1="0" y1="25%" x2="50%" y2="25%" stroke="currentColor" strokeWidth="2" className="text-border" />
						<line x1="50%" y1="25%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" />
						{/* Bottom semi → middle connector */}
						<line x1="0" y1="75%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" />
						{/* Middle → final */}
						<line x1="50%" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="2" className="text-border" />
					</svg>
				</div>

				{/* Final column */}
				<div className="flex items-center w-[16rem]">
					{finals[0] && (
						<BracketMatchNode
							match={finals[0]}
							roundLabel={BRACKET_ROUND_LABELS[BRACKET_ROUND_FINAL]}
						/>
					)}
				</div>
			</div>

			{/* 3rd place match — below the main bracket */}
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

/**
 * Mobile bracket — stacked vertically: SF1, SF2, Final, 3rd Place.
 */
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

			{/* Arrow indicator between semis and final */}
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
