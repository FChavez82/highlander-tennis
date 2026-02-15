import type { Metadata } from "next";
import { TOURNAMENT_NAME } from "@/lib/constants";

export const metadata: Metadata = {
	title: `Reglas — ${TOURNAMENT_NAME}`,
	description: "Formato, puntuación y reglas de conducta del torneo.",
};

/**
 * /reglas — Static rules page with v0 glass design.
 */
export default function ReglasPage() {
	return (
		<div className="grid gap-5">
			<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
				Reglas del Torneo
			</h1>

			<section className="glass rounded-2xl p-5 transition-shadow hover:glass-glow-primary">
				<h2 className="mb-3 text-xl font-bold uppercase tracking-wide text-foreground">Formato General</h2>
				<div className="grid gap-2.5">
					{[
						["Round-Robin", "Todos contra todos dentro de cada categoria."],
						["Dos Categorias", "Masculino (M) y Femenino (F)."],
						["Enfrentamientos", "Cada jugador juega un partido contra cada uno de los demas jugadores de su categoria."],
					].map(([title, desc]) => (
						<div key={title} className="rounded-xl bg-[hsl(210_20%_80%/0.05)] p-3 ring-1 ring-[hsl(210_20%_40%/0.08)]">
							<b className="text-foreground">{title}:</b>{" "}
							<span className="text-muted-foreground">{desc}</span>
						</div>
					))}
				</div>
			</section>

			<section className="glass rounded-2xl p-5 transition-shadow hover:glass-glow-primary">
				<h2 className="mb-3 text-xl font-bold uppercase tracking-wide text-foreground">Formato de Partidos</h2>
				<div className="grid gap-2.5">
					{[
						["Sets", "Los partidos se juegan a 2 sets."],
						["Tie-Break", "En caso de empate (1-1), se juega un super tie-break a 10 puntos como tercer set."],
						["Marcador", 'Formato: "6-4, 6-2" o "6-4, 3-6, [10-7]".'],
					].map(([title, desc]) => (
						<div key={title} className="rounded-xl bg-[hsl(210_20%_80%/0.05)] p-3 ring-1 ring-[hsl(210_20%_40%/0.08)]">
							<b className="text-foreground">{title}:</b>{" "}
							<span className="text-muted-foreground">{desc}</span>
						</div>
					))}
				</div>
			</section>

			{/* Gradient separator */}
			<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
				<section className="glass rounded-2xl p-5 transition-shadow hover:glass-glow-primary">
					<h2 className="mb-3 text-xl font-bold uppercase tracking-wide text-foreground">Clasificacion</h2>
					<div className="grid gap-2.5">
						{[
							["Victoria", "1 punto."],
							["Derrota", "0 puntos."],
							["Campeon", "El jugador con mas victorias al final del round-robin gana."],
							["Desempate", "En caso de empate en victorias, se desempata por diferencia de sets."],
						].map(([title, desc]) => (
							<div key={title} className="rounded-xl bg-[hsl(210_20%_80%/0.05)] p-3 ring-1 ring-[hsl(210_20%_40%/0.08)]">
								<b className="text-foreground">{title}:</b>{" "}
								<span className="text-muted-foreground">{desc}</span>
							</div>
						))}
					</div>
				</section>

				<section className="glass rounded-2xl p-5 transition-shadow hover:glass-glow-primary">
					<h2 className="mb-3 text-xl font-bold uppercase tracking-wide text-foreground">Reglas de Conducta</h2>
					<div className="grid gap-2.5">
						{[
							["Deportividad", "Se espera respeto entre todos los participantes."],
							["Auto-arbitraje", "Los jugadores son responsables de su propia linea de juego."],
							["Disputas", "Cualquier disputa sera resuelta por el director del torneo."],
							["Calendario", "Los jugadores coordinan entre si la fecha y hora de cada partido."],
						].map(([title, desc]) => (
							<div key={title} className="rounded-xl bg-[hsl(210_20%_80%/0.05)] p-3 ring-1 ring-[hsl(210_20%_40%/0.08)]">
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
