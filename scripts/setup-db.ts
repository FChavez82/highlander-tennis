/**
 * Database setup script — run once to create the tables.
 * Usage: npm run setup-db
 *
 * Requires POSTGRES_URL in .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });

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

	/* ── Phase & bracket columns (Phase 2 — elimination brackets) ── */
	await sql`
		DO $$
		BEGIN
			/* Add phase column if it doesn't exist */
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns
				WHERE table_name = 'matches' AND column_name = 'phase'
			) THEN
				ALTER TABLE matches
					ADD COLUMN phase VARCHAR(15) DEFAULT 'round_robin';
			END IF;

			/* Add bracket_round column if it doesn't exist */
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns
				WHERE table_name = 'matches' AND column_name = 'bracket_round'
			) THEN
				ALTER TABLE matches
					ADD COLUMN bracket_round VARCHAR(15);
			END IF;

			/* Make player columns nullable for bracket placeholder matches (final/3rd place) */
			ALTER TABLE matches ALTER COLUMN player_a_id DROP NOT NULL;
			ALTER TABLE matches ALTER COLUMN player_b_id DROP NOT NULL;
		END
		$$;
	`;
	console.log("✅ Columnas 'phase' y 'bracket_round' agregadas a 'matches'.");

	/* ── Audit logs table ─────────────────────────────────────── */
	await sql`
		CREATE TABLE IF NOT EXISTS audit_logs (
			id          SERIAL PRIMARY KEY,
			admin_email VARCHAR(255) NOT NULL,
			action      VARCHAR(50)  NOT NULL,
			entity_type VARCHAR(20)  NOT NULL,
			entity_id   INT,
			prev_values JSONB,
			new_values  JSONB,
			created_at  TIMESTAMP    DEFAULT NOW()
		);
	`;
	console.log("✅ Tabla 'audit_logs' creada.");

	console.log("\n🎾 Base de datos lista.");
}

setupDatabase().catch((err) => {
	console.error("❌ Error al crear tablas:", err);
	process.exit(1);
});
