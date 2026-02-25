/**
 * /jugadores/[id] — Player profile page.
 *
 * Shows player info, overall record, match history, and head-to-head stats.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowLeft, CircleDashed } from "lucide-react";
import ShareButton from "./ShareButton";
import { getPlayerById, getPlayerMatches, type Match } from "@/lib/db";
import { determineWinner, countSets } from "@/lib/score";
import { safeDate, isRecent } from "@/lib/utils";
import {
	CATEGORY_LABELS,
	STATUS_PLAYED,
	STATUS_PENDING,
	PHASE_BRACKET,
	PHASE_LABELS,
	BRACKET_ROUND_LABELS,
	categoryBadgeClass,
	TOURNAMENT_NAME,
	REVALIDATE_SECONDS,
	type Category,
	type BracketRound,
} from "@/lib/constants";

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = REVALIDATE_SECONDS;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const player = await getPlayerById(Number(id));
	return {
		title: player
			? `${player.name} — ${TOURNAMENT_NAME}`
			: `Jugador — ${TOURNAMENT_NAME}`,
	};
}

/* ── Head-to-head computation ── */

interface HeadToHead {
	opponentId: number;
	opponentName: string;
	wins: number;
	losses: number;
	matches: Match[];
}

function computeHeadToHead(playerId: number, matches: Match[]): HeadToHead[] {
	const played = matches.filter((m) => m.status === STATUS_PLAYED && m.score);
	const map = new Map<number, HeadToHead>();

	for (const m of played) {
		const isA = m.player_a_id === playerId;
		const opponentId = isA ? m.player_b_id : m.player_a_id;
		const opponentName = (isA ? m.player_b_name : m.player_a_name) || "Desconocido";

		if (!map.has(opponentId)) {
			map.set(opponentId, { opponentId, opponentName, wins: 0, losses: 0, matches: [] });
		}
		const h2h = map.get(opponentId)!;
		h2h.matches.push(m);

		const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score!);
		if (winnerId === playerId) {
			h2h.wins++;
		} else {
			h2h.losses++;
		}
	}

	/* Sort by most matches played, then alphabetical */
	return Array.from(map.values()).sort(
		(a, b) => b.matches.length - a.matches.length || a.opponentName.localeCompare(b.opponentName)
	);
}

/* ── Page Component ── */

export default async function PlayerProfilePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const playerId = Number(id);

	const [player, matches] = await Promise.all([
		getPlayerById(playerId),
		getPlayerMatches(playerId),
	]);

	if (!player) notFound();

	/* Compute overall record */
	const playedMatches = matches.filter((m) => m.status === STATUS_PLAYED && m.score);
	let wins = 0;
	let losses = 0;
	let setsWon = 0;
	let setsLost = 0;

	for (const m of playedMatches) {
		const isA = m.player_a_id === playerId;
		const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score!);
		if (winnerId === playerId) wins++;
		else losses++;

		const setCounts = countSets(m.score!);
		setsWon += isA ? setCounts.aSets : setCounts.bSets;
		setsLost += isA ? setCounts.bSets : setCounts.aSets;
	}

	const pendingMatches = matches.filter((m) => m.status === STATUS_PENDING);
	const headToHead = computeHeadToHead(playerId, matches);
	const setDiff = setsWon - setsLost;

	return (
		<div className="grid gap-6">
			{/* Back link */}
			<Link
				href="/jugadores"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
			>
				<ArrowLeft className="h-4 w-4" />
				Jugadores
			</Link>

			{/* Player header card */}
			<div className="glass rounded-2xl p-6">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
						{player.name}
					</h1>
					<span
						className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase ring-1 ${categoryBadgeClass(player.category)}`}
					>
						{CATEGORY_LABELS[player.category].full}
					</span>
					<ShareButton />
				</div>

				{/* Stats row */}
				<div className="mt-4 flex flex-wrap gap-4">
					<StatBox label="Victorias" value={wins} accent="text-primary" />
					<StatBox label="Derrotas" value={losses} accent="text-destructive/70" />
					<StatBox
						label="Dif. Sets"
						value={setDiff > 0 ? `+${setDiff}` : String(setDiff)}
						accent="text-muted-foreground"
					/>
					<StatBox label="Jugados" value={playedMatches.length} accent="text-muted-foreground" />
					<StatBox label="Pendientes" value={pendingMatches.length} accent="text-muted-foreground" />
				</div>
			</div>

			{/* Match history */}
			<section className="grid gap-3">
				<h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
					Historial de Partidos
				</h2>

				{matches.length === 0 ? (
					<div className="glass rounded-2xl p-8 text-center">
						<CircleDashed className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
						<p className="text-base font-semibold text-muted-foreground">
							Aun no hay partidos jugados
						</p>
						<p className="mt-1 text-sm text-muted-foreground/70">
							Los resultados apareceran aqui cuando se jueguen los partidos.
						</p>
					</div>
				) : (
					<div className="glass overflow-hidden rounded-2xl">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-[hsl(210_20%_40%/0.12)] bg-[hsl(210_20%_80%/0.03)]">
										<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Oponente
										</th>
										<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Resultado
										</th>
										<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Marcador
										</th>
										<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											Fecha
										</th>
									</tr>
								</thead>
								<tbody>
									{matches.map((m) => {
										const isA = m.player_a_id === playerId;
										const opponentName = isA ? m.player_b_name : m.player_a_name;
										const opponentId = isA ? m.player_b_id : m.player_a_id;
										const isPlayed = m.status === STATUS_PLAYED && m.score;
										const didWin = isPlayed
											? determineWinner(m.player_a_id, m.player_b_id, m.score!) === playerId
											: null;

										/* Phase label */
										const phaseLabel =
											m.phase === PHASE_BRACKET && m.bracket_round
												? BRACKET_ROUND_LABELS[m.bracket_round as BracketRound]
												: null;

										return (
											<tr
												key={m.id}
												className="border-b border-[hsl(210_20%_40%/0.06)] transition-colors hover:bg-[hsl(210_20%_80%/0.04)]"
											>
												{/* Opponent */}
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														<Link
															href={`/jugadores/${opponentId}`}
															className="font-semibold text-foreground transition-colors hover:text-primary"
														>
															{opponentName || "Por definir"}
														</Link>
														{phaseLabel && (
															<span className="rounded-md bg-[hsl(210_20%_80%/0.08)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
																{phaseLabel}
															</span>
														)}
													</div>
												</td>

												{/* Result badge */}
												<td className="px-4 py-3 text-center">
													{isPlayed ? (
														didWin ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary ring-1 ring-primary/25">
																<Trophy className="h-3 w-3" />
																Victoria
															</span>
														) : (
															<span className="inline-flex rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive ring-1 ring-destructive/25">
																Derrota
															</span>
														)
													) : (
														<span className="inline-flex rounded-full bg-[hsl(210_20%_80%/0.08)] px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
															Pendiente
														</span>
													)}
												</td>

												{/* Score */}
												<td className="px-4 py-3 text-center font-mono text-sm text-muted-foreground">
													{m.score || "—"}
												</td>

												{/* Date */}
												<td className="px-4 py-3 text-right">
													{m.date_played ? (
														<span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
															{safeDate(m.date_played).toLocaleDateString("es-ES", {
																day: "numeric",
																month: "short",
																year: "numeric",
															})}
															{isRecent(m.date_played) && (
																<span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase leading-none text-accent ring-1 ring-accent/25">
																	Nuevo
																</span>
															)}
														</span>
													) : (
														<span className="text-xs text-muted-foreground">—</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</section>

			{/* Head-to-head */}
			{headToHead.length > 0 && (
				<section className="grid gap-3">
					<h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
						Cara a Cara
					</h2>

					<div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
						{headToHead.map((h2h) => (
							<Link
								key={h2h.opponentId}
								href={`/jugadores/${h2h.opponentId}`}
								className="glass rounded-2xl p-4 transition-shadow hover:glass-glow-primary"
							>
								<div className="mb-2 font-semibold text-foreground">
									vs {h2h.opponentName}
								</div>
								<div className="flex items-center gap-3 text-sm">
									<span className="font-bold text-primary">{h2h.wins}G</span>
									<span className="text-muted-foreground">-</span>
									<span className="font-bold text-destructive/70">{h2h.losses}P</span>
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									{h2h.matches.length} {h2h.matches.length === 1 ? "partido" : "partidos"}
								</div>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

/* ── Stat box sub-component ── */

function StatBox({
	label,
	value,
	accent,
}: {
	label: string;
	value: number | string;
	accent: string;
}) {
	return (
		<div className="flex flex-col items-center rounded-xl bg-[hsl(210_20%_80%/0.04)] px-4 py-2 ring-1 ring-border/30">
			<span className={`text-2xl font-bold ${accent}`}>{value}</span>
			<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</span>
		</div>
	);
}
