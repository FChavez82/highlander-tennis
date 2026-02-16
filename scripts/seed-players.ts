/**
 * Seed script — clears all data and creates 20 Male + 25 Female players.
 * Usage: npx tsx scripts/seed-players.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const MALE_NAMES = [
	"Carlos Martinez", "Diego Rivera", "Fernando Lopez", "Gabriel Torres",
	"Hugo Sanchez", "Ivan Morales", "Javier Gutierrez", "Kevin Hernandez",
	"Luis Ramirez", "Miguel Castro", "Nicolas Vargas", "Oscar Mendoza",
	"Pablo Fuentes", "Rafael Delgado", "Santiago Rojas", "Tomas Aguilar",
	"Victor Navarro", "Walter Paredes", "Xavier Reyes", "Andres Soto",
];

const FEMALE_NAMES = [
	"Ana Garcia", "Beatriz Flores", "Camila Ortiz", "Daniela Ruiz",
	"Elena Jimenez", "Fernanda Diaz", "Gabriela Perez", "Helena Cruz",
	"Isabella Molina", "Julia Romero", "Karla Herrera", "Lucia Castillo",
	"Maria Vega", "Natalia Guerrero", "Olivia Espinoza", "Patricia Rios",
	"Renata Cordova", "Sofia Medina", "Teresa Salazar", "Valentina Acosta",
	"Ximena Figueroa", "Yolanda Campos", "Zoe Contreras", "Andrea Pacheco",
	"Bianca Marquez",
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
