/**
 * Seed script — clears all data and creates players from "Interno Colinas - Tentativo.csv".
 * 28 Varonil (M) + 22 Femenil (F) = 50 players total.
 * Usage: npx tsx scripts/seed-players.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const MALE_NAMES = [
	"Francisco Chavez", "Francisco Madrid", "Tasuko Sato", "Jesus Salomon",
	"Yuichi Castro", "Pablos Flores", "Constantino Dimopulos", "Miguel Leon",
	"Edel Flores", "Raul Camacho", "Roberto", "Daniel Elizabeth",
	"Fernando Franco", "Olga Perez", "Angel Conde", "Jesus E Alvarez (?)",
	"Juan pablo jr", "Juan pablo", "Jorge Inzunza", "Daniel esposo Ofe",
	"Raul Camacho Jr", "Fernando Esquer", "Francisco Esquer", "Ernesto Esquer",
	"Checo Padilla", "Luis Enrique Parra",
	"Juan M Sato", "Santiago Sato",
];

const FEMALE_NAMES = [
	"Daniela Rochin", "Liz Montaño", "Carolina Parra", "Lucia",
	"Sara Tirado", "Celia", "Italia", "Silvia",
	"Scarlett", "Karina", "Susana", "Elizabeth",
	"Argelia", "Lorena", "Ale Luna", "Ofelia",
	"Naomi Bernal", "Fernanda Orozco", "Wendy", "Mia",
	"Cristina Padilla", "Emma Parra",
];

async function seed() {
	console.log("🗑️  Limpiando datos...");

	/* Delete in order to respect foreign keys */
	await sql`DELETE FROM matches;`;
	await sql`DELETE FROM player_availability;`;
	await sql`DELETE FROM schedule_weeks;`;
	await sql`DELETE FROM audit_logs;`;
	await sql`DELETE FROM players;`;

	/* Reset sequences so IDs start from 1 */
	await sql`ALTER SEQUENCE players_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE matches_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE schedule_weeks_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE player_availability_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;`;

	console.log("✅ Datos eliminados.");

	/* Create Male players */
	console.log(`👨 Creando ${MALE_NAMES.length} jugadores masculinos...`);
	for (const name of MALE_NAMES) {
		await sql`INSERT INTO players (name, category) VALUES (${name}, 'M');`;
	}

	/* Create Female players */
	console.log(`👩 Creando ${FEMALE_NAMES.length} jugadoras femeninas...`);
	for (const name of FEMALE_NAMES) {
		await sql`INSERT INTO players (name, category) VALUES (${name}, 'F');`;
	}

	/* Verify */
	const { rows: counts } = await sql`
		SELECT category, COUNT(*)::int AS count FROM players GROUP BY category ORDER BY category;
	`;

	for (const row of counts) {
		console.log(`  ${row.category === 'F' ? '👩' : '👨'} ${row.category}: ${row.count} jugadores`);
	}

	console.log("\n🎾 Seed completo.");
}

seed().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
