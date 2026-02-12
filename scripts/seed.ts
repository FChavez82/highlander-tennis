/**
 * Seed script — populates the database with dummy players
 * and generates round-robin matches for both categories.
 *
 * Usage: npm run seed
 */
import { sql } from "@vercel/postgres";

const MALE_PLAYERS = [
	"Carlos Ramírez",
	"Miguel Torres",
	"Andrés López",
	"Diego Hernández",
	"Fernando García",
	"Ricardo Morales",
	"Pablo Sánchez",
	"Sebastián Díaz",
];

const FEMALE_PLAYERS = [
	"Ana Martínez",
	"Sofía Rodríguez",
	"Valentina Pérez",
	"Camila Flores",
	"Isabella Gómez",
	"Mariana Castro",
];

async function seed() {
	console.log("🌱 Sembrando datos de prueba...\n");

	/* Clear existing data */
	await sql`DELETE FROM matches;`;
	await sql`DELETE FROM players;`;
	console.log("🧹 Datos anteriores eliminados.");

	/* Insert male players */
	console.log("\n👨 Insertando jugadores masculinos...");
	const maleIds: number[] = [];
	for (const name of MALE_PLAYERS) {
		const { rows } = await sql`
			INSERT INTO players (name, category) VALUES (${name}, 'M') RETURNING id;
		`;
		maleIds.push(rows[0].id);
		console.log(`  + ${name} (id: ${rows[0].id})`);
	}

	/* Insert female players */
	console.log("\n👩 Insertando jugadoras femeninas...");
	const femaleIds: number[] = [];
	for (const name of FEMALE_PLAYERS) {
		const { rows } = await sql`
			INSERT INTO players (name, category) VALUES (${name}, 'F') RETURNING id;
		`;
		femaleIds.push(rows[0].id);
		console.log(`  + ${name} (id: ${rows[0].id})`);
	}

	/* Generate round-robin matches for males */
	console.log("\n🎾 Generando partidos masculinos...");
	let maleCount = 0;
	for (let i = 0; i < maleIds.length; i++) {
		for (let j = i + 1; j < maleIds.length; j++) {
			await sql`
				INSERT INTO matches (player_a_id, player_b_id, category)
				VALUES (${maleIds[i]}, ${maleIds[j]}, 'M');
			`;
			maleCount++;
		}
	}
	console.log(`  ${maleCount} partidos generados.`);

	/* Generate round-robin matches for females */
	console.log("\n🎾 Generando partidos femeninos...");
	let femaleCount = 0;
	for (let i = 0; i < femaleIds.length; i++) {
		for (let j = i + 1; j < femaleIds.length; j++) {
			await sql`
				INSERT INTO matches (player_a_id, player_b_id, category)
				VALUES (${femaleIds[i]}, ${femaleIds[j]}, 'F');
			`;
			femaleCount++;
		}
	}
	console.log(`  ${femaleCount} partidos generados.`);

	/* Summary */
	console.log("\n────────────────────────────────");
	console.log(`✅ Seed completado:`);
	console.log(`   ${MALE_PLAYERS.length} jugadores masculinos → ${maleCount} partidos`);
	console.log(`   ${FEMALE_PLAYERS.length} jugadoras femeninas → ${femaleCount} partidos`);
	console.log(`   Total: ${maleCount + femaleCount} partidos`);
}

seed().catch((err) => {
	console.error("❌ Error al sembrar datos:", err);
	process.exit(1);
});
