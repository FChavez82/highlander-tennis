/**
 * /api/schedule/[weekId]
 *
 * GET    — Get week details + its matches
 * PUT    — Update week status (draft → published → completed)
 * DELETE — Delete a week and all its matches
 */
import { NextRequest, NextResponse } from "next/server";
import {
	getScheduleWeekById,
	getMatchesByWeek,
	updateWeekStatus,
	deleteScheduleWeek,
} from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import {
	WEEK_STATUS_DRAFT,
	WEEK_STATUS_PUBLISHED,
	WEEK_STATUS_COMPLETED,
	type WeekStatus,
} from "@/lib/constants";

const VALID_STATUSES = new Set<string>([
	WEEK_STATUS_DRAFT,
	WEEK_STATUS_PUBLISHED,
	WEEK_STATUS_COMPLETED,
]);

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

		const matches = await getMatchesByWeek(weekId);
		return NextResponse.json({ week, matches });
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener semana." },
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

		const body = (await request.json()) as Record<string, unknown>;
		const { status } = body;

		if (!status || !VALID_STATUSES.has(status as string)) {
			return NextResponse.json(
				{ error: `Estado debe ser: ${Array.from(VALID_STATUSES).join(", ")}` },
				{ status: 400 }
			);
		}

		const prev = await getScheduleWeekById(weekId);
		if (!prev) {
			return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });
		}

		const updated = await updateWeekStatus(weekId, status as WeekStatus);

		const adminEmail = session.user?.email ?? "unknown";
		await logAction(adminEmail, "update_week_status", "schedule", weekId, {
			status: prev.status,
		}, {
			status: updated.status,
		});

		return NextResponse.json({ success: true, week: updated });
	} catch {
		return NextResponse.json(
			{ error: "Error al actualizar semana." },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: NextRequest,
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

		const prev = await getScheduleWeekById(weekId);
		if (!prev) {
			return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });
		}

		await deleteScheduleWeek(weekId);

		const adminEmail = session.user?.email ?? "unknown";
		await logAction(adminEmail, "delete_schedule_week", "schedule", weekId, {
			week_number: prev.week_number,
			start_date: prev.start_date,
			status: prev.status,
		}, null);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar semana." },
			{ status: 500 }
		);
	}
}
