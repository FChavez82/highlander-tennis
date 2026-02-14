import { unstable_noStore as noStore } from "next/cache";
import { getStats } from "@/lib/db";
import { Trophy, CalendarDays, Users, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
	TOURNAMENT_NAME,
	TOURNAMENT_DATES,
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	STATUS_PENDING,
	STATUS_PLAYED,
	CATEGORY_LABELS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
	noStore();
	const stats = await getStats();
	const totalPlayers = stats.players[CATEGORY_MALE] + stats.players[CATEGORY_FEMALE];
	const totalMatches = stats.matches[STATUS_PENDING] + stats.matches[STATUS_PLAYED];

	return (
		<section className="flex flex-col items-center justify-center gap-8 py-20 text-center">
			{/* Trophy icon */}
			<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/60 to-accent/40 ring-1 ring-white/10">
				<Trophy className="h-10 w-10 text-white" />
			</div>

			{/* Tournament name */}
			<h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl lg:text-6xl">
				{TOURNAMENT_NAME}
			</h1>

			{/* Subtitle */}
			<p className="text-lg text-muted-foreground sm:text-xl">
				Torneo Round-Robin de Tenis
			</p>

			{/* Dates */}
			<div className="flex items-center gap-2 rounded-xl bg-card/60 px-5 py-3 ring-1 ring-border">
				<CalendarDays className="h-5 w-5 text-accent" />
				<span className="text-sm font-medium sm:text-base">{TOURNAMENT_DATES}</span>
			</div>

			{/* Stats dashboard */}
			<div className="grid w-full max-w-2xl grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="glass rounded-2xl p-5">
					<Users className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{totalPlayers}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugadores</div>
					<div className="mt-0.5 text-xs text-muted-foreground/70">{stats.players[CATEGORY_MALE]} {CATEGORY_LABELS[CATEGORY_MALE].short} / {stats.players[CATEGORY_FEMALE]} {CATEGORY_LABELS[CATEGORY_FEMALE].short}</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<CalendarDays className="mx-auto mb-2 h-5 w-5 text-foreground" />
					<div className="font-display text-3xl font-bold text-foreground">{totalMatches}</div>
					<div className="mt-1 text-sm text-muted-foreground">Total Partidos</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<Clock className="mx-auto mb-2 h-5 w-5 text-accent" />
					<div className="font-display text-3xl font-bold text-accent">{stats.matches[STATUS_PENDING]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Pendientes</div>
				</div>
				<div className="glass rounded-2xl p-5">
					<CheckCircle className="mx-auto mb-2 h-5 w-5 text-primary" />
					<div className="font-display text-3xl font-bold text-primary">{stats.matches[STATUS_PLAYED]}</div>
					<div className="mt-1 text-sm text-muted-foreground">Jugados</div>
				</div>
			</div>

			{/* CTA links */}
			<div className="flex flex-wrap justify-center gap-4 pt-4">
				<Link
					href="/reglas"
					className="rounded-lg bg-primary/20 px-6 py-3 text-sm font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/30"
				>
					Ver Reglas
				</Link>
				<Link
					href="/jugadores"
					className="rounded-lg px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
				>
					Jugadores
				</Link>
				<Link
					href="/resultados"
					className="rounded-lg px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
				>
					Resultados
				</Link>
			</div>
		</section>
	);
}
