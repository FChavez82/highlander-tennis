/**
 * /reglas — Static rules page with liquid glass styling.
 */
export default function ReglasPage() {
	return (
		<div style={{ display: "grid", gap: 16 }}>
			<h1 className="lg-h1">Reglas del Torneo</h1>

			<section className="lg-card" style={{ padding: 24 }}>
				<div className="lg-kicker">FORMATO</div>
				<h2 className="lg-h2" style={{ marginTop: 8 }}>Formato General</h2>
				<div style={{ display: "grid", gap: 10 }}>
					{[
						["Round-Robin", "Todos contra todos dentro de cada categoria."],
						["Dos Categorias", "Masculino (M) y Femenino (F)."],
						["Enfrentamientos", "Cada jugador juega un partido contra cada uno de los demas jugadores de su categoria."],
					].map(([title, desc]) => (
						<div key={title} className="lg-list-item">
							<b>{title}:</b> {desc}
						</div>
					))}
				</div>
			</section>

			<section className="lg-card" style={{ padding: 24 }}>
				<div className="lg-kicker">PARTIDOS</div>
				<h2 className="lg-h2" style={{ marginTop: 8 }}>Formato de Partidos</h2>
				<div style={{ display: "grid", gap: 10 }}>
					{[
						["Sets", "Los partidos se juegan a 2 sets."],
						["Tie-Break", "En caso de empate (1-1), se juega un super tie-break a 10 puntos como tercer set."],
						["Marcador", 'Formato: "6-4, 6-2" o "6-4, 3-6, [10-7]".'],
					].map(([title, desc]) => (
						<div key={title} className="lg-list-item">
							<b>{title}:</b> {desc}
						</div>
					))}
				</div>
			</section>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lg-grid-2">
				<section className="lg-card" style={{ padding: 24 }}>
					<div className="lg-kicker">PUNTOS</div>
					<h2 className="lg-h2" style={{ marginTop: 8 }}>Clasificacion</h2>
					<div style={{ display: "grid", gap: 10 }}>
						{[
							["Victoria", "1 punto."],
							["Derrota", "0 puntos."],
							["Campeon", "El jugador con mas victorias al final del round-robin gana."],
							["Desempate", "En caso de empate en victorias, se desempata por diferencia de sets."],
						].map(([title, desc]) => (
							<div key={title} className="lg-list-item">
								<b>{title}:</b> {desc}
							</div>
						))}
					</div>
				</section>

				<section className="lg-card" style={{ padding: 24 }}>
					<div className="lg-kicker">CONDUCTA</div>
					<h2 className="lg-h2" style={{ marginTop: 8 }}>Reglas de Conducta</h2>
					<div style={{ display: "grid", gap: 10 }}>
						{[
							["Deportividad", "Se espera respeto entre todos los participantes."],
							["Auto-arbitraje", "Los jugadores son responsables de su propia linea de juego."],
							["Disputas", "Cualquier disputa sera resuelta por el director del torneo."],
							["Calendario", "Los jugadores coordinan entre si la fecha y hora de cada partido."],
						].map(([title, desc]) => (
							<div key={title} className="lg-list-item">
								<b>{title}:</b> {desc}
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
