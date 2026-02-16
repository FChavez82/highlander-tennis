/**
 * POST /api/admin/reset
 *
 * Truncates all tournament data (players + matches).
 * Protected — requires a valid admin session.
 */
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST() {
	try {
		/* Verify the caller has a valid admin session */
		const session = await getAdminSession();
		if (!session) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		/* Audit: log BEFORE truncate so the log entry survives the wipe */
		await logAction(
			session.user?.email ?? "unknown",
			"reset_data",
			"system",
			null,
			null,
			{ action: "truncate matches, players" }
		);

		/* Wipe all tournament data — matches first (FK dependency), then players */
		await sql`TRUNCATE matches, players RESTART IDENTITY CASCADE;`;

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Reset error:", error);
		return NextResponse.json(
			{ error: "Error al reiniciar datos." },
			{ status: 500 }
		);
	}
}
