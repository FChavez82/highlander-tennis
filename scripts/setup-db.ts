/**
 * Database setup script — run once to create the tables.
 * Usage: npm run setup-db
 *
 * Requires POSTGRES_URL in .env.local
 */
import { sql } from "@vercel/postgres";

async function setupDatabase() {
	console.log("🏗️  Creando tablas...");

	/* ── Players table ─────────────────────────────────────────── */
	await sql`
		CREATE TABLE IF NOT EXISTS players (
			id         SERIAL PRIMARY KEY,
			name       VARCHAR(100) NOT NULL,
			category   VARCHAR(1)   NOT NULL CHECK (category IN ('M', 'F')),
			created_at TIMESTAMP    DEFAULT NOW()
		);
	`;
	console.log("✅ Tabla 'players' creada.");

	/* ── Matches table ─────────────────────────────────────────── */
	await sql`
		CREATE TABLE IF NOT EXISTS matches (
			id           SERIAL PRIMARY KEY,
			player_a_id  INT         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
			player_b_id  INT         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
			category     VARCHAR(1)  NOT NULL CHECK (category IN ('M', 'F')),
			status       VARCHAR(10) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'jugado')),
			score        VARCHAR(50),
			date_played  DATE,
			created_at   TIMESTAMP   DEFAULT NOW()
		);
	`;
	console.log("✅ Tabla 'matches' creada.");

	console.log("\n🎾 Base de datos lista.");
}

setupDatabase().catch((err) => {
	console.error("❌ Error al crear tablas:", err);
	process.exit(1);
});
