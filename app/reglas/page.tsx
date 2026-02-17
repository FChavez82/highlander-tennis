import type { Metadata } from "next";
import { TOURNAMENT_NAME } from "@/lib/constants";
import {
	LayoutGrid,
	Target,
	CalendarDays,
	Trophy,
	ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
	title: `Reglas — ${TOURNAMENT_NAME}`,
	description: "Formato, puntuación y reglas de conducta del torneo.",
};

/**
 * /reglas — Static rules page with v0 glass design.
 *
 * Each section has a unique colored accent: icon, left border, and tinted
 * rule items. The colors are drawn from the site-wide design system palette.
 */
export default function ReglasPage() {
	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
				Reglas del Torneo
			</h1>

			{/* ── Formato General ── teal (primary) */}
			<section className="glass rounded-2xl border-l-4 border-l-primary p-5 transition-shadow hover:glass-glow-primary">
				<h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-primary">
					<LayoutGrid className="h-5 w-5" />
					Formato General
				</h2>
				<div className="grid gap-2.5">
					{[
						["Fase 1 — Round-Robin", "Todos contra todos dentro de cada categoria. Ningun jugador se enfrenta al mismo rival dos veces."],
						["Dos Categorias", "Masculino y Femenino. Los emparejamientos se generan por separado en cada categoria."],
						["Calendario Semanal", "Cada semana se asigna 1 partido por jugador. Los emparejamientos se publican cada 2 semanas."],
						["Fase 2 — Eliminatoria", "Los mejores clasificados avanzan a una fase eliminatoria al finalizar el round-robin."],
					].map(([title, desc]) => (
						<div key={title} className="rounded-xl bg-primary/[0.04] p-3 ring-1 ring-primary/10">
							<b className="text-foreground">{title}:</b>{" "}
							<span className="text-muted-foreground">{desc}</span>
						</div>
					))}
				</div>
			</section>

			{/* ── Formato de Partidos ── gold (accent) */}
			<section className="glass rounded-2xl border-l-4 border-l-accent p-5 transition-shadow hover:glass-glow-accent">
				<h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-accent">
					<Target className="h-5 w-5" />
					Formato de Partidos
				</h2>
				<div className="grid gap-2.5">
					{[
						["Sets", "Los partidos se juegan a 2 sets."],
						["Tie-Break", "En caso de empate (1-1), se juega un super tie-break a 10 puntos como tercer set."],
						["Marcador", 'Formato: "6-4, 6-2" o "6-4, 3-6, [10-7]".'],
					].map(([title, desc]) => (
						<div key={title} className="rounded-xl bg-accent/[0.04] p-3 ring-1 ring-accent/10">
							<b className="text-foreground">{title}:</b>{" "}
							<span className="text-muted-foreground">{desc}</span>
						</div>
					))}
				</div>
			</section>

			{/* ── Calendario y Disponibilidad ── blue */}
			<section className="glass rounded-2xl border-l-4 border-l-blue-400 p-5 transition-shadow hover:shadow-[inset_0_1px_0_0_hsl(207_90%_61%/0.1),0_0_20px_-4px_hsl(207_90%_61%/0.15),0_4px_24px_-4px_hsl(210_30%_4%/0.5)]">
				<h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-blue-400">
					<CalendarDays className="h-5 w-5" />
					Calendario y Disponibilidad
				</h2>
				<div className="grid gap-2.5">
					{[
						["Publicacion", "Los partidos se generan y publican cada 2 semanas. Consulta la pagina \"Semana\" para ver tus proximos partidos."],
						["Disponibilidad", "Si no puedes jugar una semana, notifica al administrador antes de que se publique el calendario. Seras excluido de esa semana."],
						["Descanso (Bye)", "Si hay un numero impar de jugadores disponibles, uno descansara esa semana. El sistema rota los descansos de forma justa."],
						["Cancelacion", "Si un partido se cancela, el emparejamiento queda disponible para futuras semanas."],
						["Coordinacion", "Los jugadores coordinan entre si la fecha, hora y lugar de cada partido dentro de la semana asignada."],
					].map(([title, desc]) => (
						<div key={title} className="rounded-xl bg-blue-400/[0.04] p-3 ring-1 ring-blue-400/10">
							<b className="text-foreground">{title}:</b>{" "}
							<span className="text-muted-foreground">{desc}</span>
						</div>
					))}
				</div>
			</section>

			{/* Gradient separator */}
			<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
				{/* ── Clasificacion ── emerald */}
				<section className="glass rounded-2xl border-l-4 border-l-emerald-400 p-5 transition-shadow hover:shadow-[inset_0_1px_0_0_hsl(160_65%_60%/0.1),0_0_20px_-4px_hsl(160_84%_39%/0.15),0_4px_24px_-4px_hsl(210_30%_4%/0.5)]">
					<h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-emerald-400">
						<Trophy className="h-5 w-5" />
						Clasificacion
					</h2>
					<div className="grid gap-2.5">
						{[
							["Victoria", "1 punto."],
							["Derrota", "0 puntos."],
							["Campeon", "El jugador con mas victorias al final del round-robin gana."],
							["Desempate", "En caso de empate en victorias, se desempata por diferencia de sets."],
						].map(([title, desc]) => (
							<div key={title} className="rounded-xl bg-emerald-400/[0.04] p-3 ring-1 ring-emerald-400/10">
								<b className="text-foreground">{title}:</b>{" "}
								<span className="text-muted-foreground">{desc}</span>
							</div>
						))}
					</div>
				</section>

				{/* ── Reglas de Conducta ── pink (cat-female) */}
				<section className="glass rounded-2xl border-l-4 border-l-pink-400 p-5 transition-shadow hover:shadow-[inset_0_1px_0_0_hsl(330_81%_60%/0.1),0_0_20px_-4px_hsl(330_81%_60%/0.15),0_4px_24px_-4px_hsl(210_30%_4%/0.5)]">
					<h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-pink-400">
						<ShieldCheck className="h-5 w-5" />
						Reglas de Conducta
					</h2>
					<div className="grid gap-2.5">
						{[
							["Deportividad", "Se espera respeto entre todos los participantes."],
							["Auto-arbitraje", "Los jugadores son responsables de su propia linea de juego."],
							["Disputas", "Cualquier disputa sera resuelta por el director del torneo."],
							["Resultados", "Ambos jugadores deben reportar el marcador al administrador al finalizar el partido."],
						].map(([title, desc]) => (
							<div key={title} className="rounded-xl bg-pink-400/[0.04] p-3 ring-1 ring-pink-400/10">
								<b className="text-foreground">{title}:</b>{" "}
								<span className="text-muted-foreground">{desc}</span>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
