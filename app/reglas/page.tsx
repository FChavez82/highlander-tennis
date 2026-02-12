/**
 * /reglas — Static rules page for the tournament.
 * All content in Spanish, styled with Tailwind typography.
 */
export default function ReglasPage() {
	return (
		<div className="space-y-8">
			<h1 className="text-3xl font-bold text-court-800">
				Reglas del Torneo
			</h1>

			<section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
				<h2 className="text-xl font-semibold text-court-700">
					Formato
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-700">
					<li>
						Torneo <strong>round-robin</strong> (todos contra todos)
						dentro de cada categoría.
					</li>
					<li>
						Dos categorías: <strong>Masculino (M)</strong> y{" "}
						<strong>Femenino (F)</strong>.
					</li>
					<li>
						Cada jugador juega un partido contra cada uno de los
						demás jugadores de su categoría.
					</li>
				</ul>
			</section>

			<section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
				<h2 className="text-xl font-semibold text-court-700">
					Formato de Partidos
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-700">
					<li>
						Los partidos se juegan a <strong>2 sets</strong>.
					</li>
					<li>
						En caso de empate (1-1), se juega un{" "}
						<strong>super tie-break a 10 puntos</strong> como tercer
						set.
					</li>
					<li>
						Formato de marcador: &quot;6-4, 6-2&quot; o &quot;6-4,
						3-6, [10-7]&quot;.
					</li>
				</ul>
			</section>

			<section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
				<h2 className="text-xl font-semibold text-court-700">
					Clasificación
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-700">
					<li>
						<strong>Victoria</strong> = 1 punto.
					</li>
					<li>
						<strong>Derrota</strong> = 0 puntos.
					</li>
					<li>
						El jugador con más victorias al final del round-robin
						gana el torneo.
					</li>
					<li>
						En caso de empate en victorias, se desempata por{" "}
						<strong>diferencia de sets</strong>.
					</li>
				</ul>
			</section>

			<section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
				<h2 className="text-xl font-semibold text-court-700">
					Calendario
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-700">
					<li>
						Los jugadores coordinan entre sí la fecha y hora de cada
						partido.
					</li>
					<li>
						Todos los partidos deben completarse dentro del plazo
						establecido por el director del torneo.
					</li>
					<li>
						Los resultados se reportan al director del torneo para
						su registro.
					</li>
				</ul>
			</section>

			<section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
				<h2 className="text-xl font-semibold text-court-700">
					Conducta
				</h2>
				<ul className="list-disc list-inside space-y-2 text-gray-700">
					<li>Se espera deportividad y respeto entre todos los participantes.</li>
					<li>Los jugadores son responsables de su propia línea de juego (auto-arbitraje).</li>
					<li>Cualquier disputa será resuelta por el director del torneo.</li>
				</ul>
			</section>
		</div>
	);
}
