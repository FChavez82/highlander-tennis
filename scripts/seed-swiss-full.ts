/**
 * seed-swiss-full.ts — TEMPORARY TEST DATA. Delete before going live.
 *
 * Full 6-round Swiss tournament simulation — all rounds played, all scores filled.
 * Uses the real 48-player Colinas Invitacional roster with deterministic seeds
 * so the data is reproducible.
 *
 * Usage: npm run seed-swiss-full
 * Cleanup: npm run reset-db  (or re-run seed-swiss-full to overwrite)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "@vercel/postgres";
import { simulateSwiss, SWISS_ROUNDS } from "@/lib/formats";
import type { Standing } from "@/lib/db";

/* ── Roster ── */

const MALE_NAMES = [
	"Francisco Chavez", "Francisco Madrid", "Tasuko Sato", "Jesus Salomon",
	"Yuichi Castro", "Pablos Flores", "Constantino Dimopulos", "Miguel Leon",
	"Edel Flores", "Raul Camacho", "Roberto", "Daniel Elizabeth",
	"Fernando Franco", "Olga Perez", "Angel Conde", "Jesus E Alvarez (?)",
	"Juan pablo jr", "Juan pablo", "Jorge Inzunza", "Daniel esposo Ofe",
	"Raul Camacho Jr", "Fernando Esquer", "Francisco Esquer", "Ernesto Esquer",
	"Checo Padilla", "Luis Enrique Parra", "Juan M Sato", "Santiago Sato",
];

const FEMALE_NAMES = [
	"Daniela Rochin", "Liz Montaño", "Carolina Parra", "Lucia",
	"Sara Tirado", "Celia", "Italia", "Silvia",
	"Scarlett", "Karina", "Susana", "Elizabeth",
	"Argelia", "Lorena", "Ale Luna", "Ofelia",
	"Naomi Bernal", "Fernanda Orozco", "Wendy", "Mia",
	"Cristina Padilla", "Emma Parra",
];

/* ── All 6 rounds completed ── */

const ROUND_CONFIG = [
	{ weekNum: 1, start: "2026-04-06", end: "2026-04-12", playedDate: "2026-04-08" },
	{ weekNum: 2, start: "2026-04-13", end: "2026-04-19", playedDate: "2026-04-15" },
	{ weekNum: 3, start: "2026-04-20", end: "2026-04-26", playedDate: "2026-04-22" },
	{ weekNum: 4, start: "2026-04-27", end: "2026-05-03", playedDate: "2026-04-29" },
	{ weekNum: 5, start: "2026-05-04", end: "2026-05-10", playedDate: "2026-05-06" },
	{ weekNum: 6, start: "2026-05-11", end: "2026-05-17", playedDate: "2026-05-13" },
] as const;

function makeStandings(ids: number[], names: string[], category: "M" | "F"): Standing[] {
	return ids.map((id, i) => ({
		id, name: names[i], category,
		played: 0, won: 0, lost: 0, pending: 0, sets_won: 0, sets_lost: 0,
	}));
}

async function seed() {
	console.log("\n⚠️  TEST DATA — delete before going live.\n");
	console.log("🗑️  Limpiando datos existentes...");

	await sql`DELETE FROM matches;`;
	await sql`DELETE FROM player_availability;`;
	await sql`DELETE FROM schedule_weeks;`;
	await sql`DELETE FROM audit_logs;`;
	await sql`DELETE FROM players;`;

	await sql`ALTER SEQUENCE players_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE matches_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE schedule_weeks_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE player_availability_id_seq RESTART WITH 1;`;
	await sql`ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;`;

	/* ── Players ── */

	console.log(`\n👨 Insertando ${MALE_NAMES.length} jugadores masculinos...`);
	const maleIds: number[] = [];
	for (const name of MALE_NAMES) {
		const { rows } = await sql`INSERT INTO players (name, category) VALUES (${name}, 'M') RETURNING id;`;
		maleIds.push(rows[0].id);
	}

	console.log(`👩 Insertando ${FEMALE_NAMES.length} jugadoras femeninas...`);
	const femaleIds: number[] = [];
	for (const name of FEMALE_NAMES) {
		const { rows } = await sql`INSERT INTO players (name, category) VALUES (${name}, 'F') RETURNING id;`;
		femaleIds.push(rows[0].id);
	}

	/* ── Schedule weeks ── */

	console.log("\n📅 Creando rondas...");
	const weekIds: number[] = [];
	for (const cfg of ROUND_CONFIG) {
		const { rows } = await sql`
			INSERT INTO schedule_weeks (week_number, start_date, end_date, status)
			VALUES (${cfg.weekNum}, ${cfg.start}, ${cfg.end}, 'completed')
			RETURNING id;
		`;
		weekIds.push(rows[0].id);
	}

	/* ── Simulate & insert ── */

	const maleRounds   = simulateSwiss(makeStandings(maleIds,   MALE_NAMES,   "M"), 2026);
	const femaleRounds = simulateSwiss(makeStandings(femaleIds, FEMALE_NAMES, "F"), 2027);

	console.log("\n🎾 Insertando partidos...\n");
	let totalPlayed = 0;

	for (let r = 0; r < SWISS_ROUNDS; r++) {
		const cfg    = ROUND_CONFIG[r];
		const weekId = weekIds[r];

		for (const match of maleRounds[r].matches) {
			await sql`
				INSERT INTO matches (player_a_id, player_b_id, category, week_id, phase, status, score, date_played)
				VALUES (${match.playerA.id}, ${match.playerB.id}, 'M', ${weekId}, 'round_robin', 'jugado', ${match.score}, ${cfg.playedDate});
			`;
			totalPlayed++;
		}

		for (const match of femaleRounds[r].matches) {
			await sql`
				INSERT INTO matches (player_a_id, player_b_id, category, week_id, phase, status, score, date_played)
				VALUES (${match.playerA.id}, ${match.playerB.id}, 'F', ${weekId}, 'round_robin', 'jugado', ${match.score}, ${cfg.playedDate});
			`;
			totalPlayed++;
		}

		console.log(
			`   ✅ Ronda ${r + 1}  (${cfg.playedDate})` +
			`  →  ${maleRounds[r].matches.length}M + ${femaleRounds[r].matches.length}F partidos`
		);
	}

	/* ── Final standings summary ── */

	const lastMaleStandings   = maleRounds[SWISS_ROUNDS - 1].standings;
	const lastFemaleStandings = femaleRounds[SWISS_ROUNDS - 1].standings;

	console.log("\n────────────────────────────────────────────────");
	console.log(`✅ ${totalPlayed} partidos jugados insertados.\n`);

	console.log("🏆 Top 5 Varonil:");
	lastMaleStandings.slice(0, 5).forEach((r, i) =>
		console.log(`   ${i + 1}. ${r.player.name.padEnd(24)} ${r.wins}V ${r.losses}P`)
	);

	console.log("\n🏆 Top 5 Femenil:");
	lastFemaleStandings.slice(0, 5).forEach((r, i) =>
		console.log(`   ${i + 1}. ${r.player.name.padEnd(24)} ${r.wins}V ${r.losses}P`)
	);

	console.log("\n⚠️  Recuerda borrar estos datos antes del torneo real.");
}

seed().catch((err) => {
	console.error("\n❌ Error:", err);
	process.exit(1);
});
