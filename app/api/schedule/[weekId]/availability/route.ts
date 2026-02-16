/**
 * /api/schedule/[weekId]/availability
 *
 * GET — Get all players' availability for a specific week
 * PUT — Toggle a player's availability for a week
 *       Body: { player_id: number, available: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import {
	getScheduleWeekById,
	getWeekAvailability,
	setPlayerAvailability,
} from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(
	_request: NextRequest,
	{ params }: { params: { weekId: string } }
) {
	try {
		const weekId = parseInt(params.weekId, 10);
		if (isNaN(weekId)) {
			return NextResponse.json({ error: "ID inválido." }, { status: 400 });
		}

		const week = await getScheduleWeekById(weekId);
		if (!week) {
			return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });
		}

		const availability = await getWeekAvailability(weekId);
		return NextResponse.json({ week, availability });
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener disponibilidad." },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { weekId: string } }
) {
	try {
		const session = await getAdminSession();
		if (!session) {
			return NextResponse.json({ error: "No autorizado." }, { status: 401 });
		}

		const weekId = parseInt(params.weekId, 10);
		if (isNaN(weekId)) {
			return NextResponse.json({ error: "ID inválido." }, { status: 400 });
		}

		const week = await getScheduleWeekById(weekId);
		if (!week) {
			return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });
		}

		const body = (await request.json()) as Record<string, unknown>;
		const { player_id, available } = body;

		if (typeof player_id !== "number" || typeof available !== "boolean") {
			return NextResponse.json(
				{ error: "Se requiere player_id (number) y available (boolean)." },
				{ status: 400 }
			);
		}

		await setPlayerAvailability(player_id, weekId, available);

		const adminEmail = session.user?.email ?? "unknown";
		await logAction(adminEmail, "set_availability", "schedule", weekId, null, {
			player_id,
			available,
			week_number: week.week_number,
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al actualizar disponibilidad." },
			{ status: 500 }
		);
	}
}
