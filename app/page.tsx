import Link from "next/link";
import { getStats, getRecentMatches } from "@/lib/db";
import { determineWinner } from "@/lib/score";
import { Trophy, CalendarDays, Users, Clock, CheckCircle } from "lucide-react";
import {
	TOURNAMENT_NAME,
	TOURNAMENT_DATES,
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	STATUS_PENDING,
	STATUS_PLAYED,
} from "@/lib/constants";

/** Revalidate every 60 seconds — public viewers see cached data, DB is hit at most once/min */
export const revalidate = 60;

export default async function Home() {
	const [stats, recentMatches] = await Promise.all([getStats(), getRecentMatches(3)]);
	const totalPlayers = stats.players[CATEGORY_MALE] + stats.players[CATEGORY_FEMALE];
	const totalMatches = stats.matches[STATUS_PENDING] + stats.matches[STATUS_PLAYED];

	return (
		<section className="flex flex-col items-center justify-center gap-8 py-20 text-center">
			{/* Tournament info box — same glass style as stat cards */}
			<div className="glass rounded-2xl px-8 py-7 w-full max-w-2xl">
				<div className="flex flex-col items-center gap-4">
					{/* Logo */}
					<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/60 to-accent/40 ring-1 ring-white/10">
						<Trophy className="h-10 w-10 text-white" />
					</div>
					{/* Tournament name */}
					<h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl lg:text-6xl">
						{TOURNAMENT_NAME}
					</h1>
					{/* Subtitle + Dates */}
					<div className="flex flex-col items-center gap-1">
						<span className="text-sm font-medium text-muted-foreground sm:text-base">
							Torneo Round-Robin de Tenis
						</span>
						<div className="flex items-center gap-2">
							<CalendarDays className="h-4 w-4 text-accent" />
							<span className="text-sm font-medium sm:text-base">{TOURNAMENT_DATES}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Stats dashboard */}
			<div className="grid w-full max-w-2xl grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="glass rounded-2xl p-5">
					<Users className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{totalPlayers}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugadores</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<CalendarDays className="mx-auto mb-2 h-5 w-5 text-foreground" />
					<div className="font-display text-3xl font-bold text-foreground">{totalMatches}</div>
					<div className="mt-1 text-sm text-muted-foreground">Total Partidos</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<CheckCircle className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{stats.matches[STATUS_PLAYED]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugados</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<Clock className="mx-auto mb-2 h-5 w-5 text-accent" />
					<div className="font-display text-3xl font-bold text-accent">{stats.matches[STATUS_PENDING]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Pendientes</div>
				</div>
			</div>

			{/* Recent results — only show if there are played matches */}
			{recentMatches.length > 0 && (
				<div className="w-full max-w-2xl">
					<h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wider text-foreground">
						Ultimos Resultados
					</h2>
					<div className="grid gap-3">
						{recentMatches.map((m) => {
							const winnerId = determineWinner(m.player_a_id, m.player_b_id, m.score!);
							const aWon = winnerId === m.player_a_id;
							/* Format date */
							const dateStr = m.date_played
								? new Date(
										(typeof m.date_played === "string" ? m.date_played : (m.date_played as Date).toISOString()).slice(0, 10) + "T12:00:00"
									).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
								: "";

							return (
								<div
									key={m.id}
									className="glass flex items-center gap-3 rounded-2xl px-5 py-4"
								>
									{/* Winner trophy */}
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-400">
										<Trophy className="h-4 w-4" />
									</div>

									{/* Players and score */}
									<div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
										<div className="flex items-center gap-1.5 text-sm">
											<Link
												href={`/jugadores/${m.player_a_id}`}
												className={`font-semibold transition-colors hover:text-primary ${aWon ? "text-primary" : "text-foreground"}`}
											>
												{m.player_a_name}
											</Link>
											<span className="text-muted-foreground">vs</span>
											<Link
												href={`/jugadores/${m.player_b_id}`}
												className={`font-semibold transition-colors hover:text-primary ${!aWon ? "text-primary" : "text-foreground"}`}
											>
												{m.player_b_name}
											</Link>
										</div>
										<span className="font-mono text-xs text-muted-foreground">
											{m.score}
										</span>
									</div>

									{/* Date */}
									<span className="shrink-0 text-xs text-muted-foreground">
										{dateStr}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

		</section>
	);
}
