/**
 * /api/schedule
 *
 * GET  — List all schedule weeks
 * POST — Generate the next batch of schedule weeks (creates week rows + initializes availability)
 */
import { NextResponse } from "next/server";
import {
	getScheduleWeeks,
	getMaxWeekNumber,
	createScheduleWeek,
	initializeWeekAvailability,
} from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { SCHEDULE_GENERATION_WEEKS } from "@/lib/constants";

export async function GET() {
	try {
		const weeks = await getScheduleWeeks();
		return NextResponse.json(weeks);
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener semanas." },
			{ status: 500 }
		);
	}
}

export async function POST() {
	try {
		const session = await getAdminSession();
		if (!session) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		const adminEmail = session.user?.email ?? "unknown";

		/* Figure out where the next batch starts:
		   - If weeks already exist, start from the Monday after the last week's end_date
		   - Otherwise, start from the next Monday relative to today */
		const existingWeeks = await getScheduleWeeks();
		const maxWeekNumber = await getMaxWeekNumber();

		let nextMonday: Date;
		if (existingWeeks.length > 0) {
			/* Start from the day after the last week's Sunday.
			   end_date may be a Date object or string from Postgres — normalize it. */
			const lastWeek = existingWeeks[existingWeeks.length - 1];
			const endStr = typeof lastWeek.end_date === "string"
				? lastWeek.end_date
				: (lastWeek.end_date as unknown as Date).toISOString().slice(0, 10);
			nextMonday = new Date(endStr + "T12:00:00");
			nextMonday.setDate(nextMonday.getDate() + 1);
		} else {
			/* Find the next Monday from today */
			nextMonday = new Date();
			const day = nextMonday.getDay(); /* 0=Sun, 1=Mon, ... */
			const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
			nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
		}

		/* Create N weeks (default 2) */
		const createdWeeks = [];
		for (let i = 0; i < SCHEDULE_GENERATION_WEEKS; i++) {
			const weekNum = maxWeekNumber + i + 1;

			/* Calculate Mon start and Sun end for this week */
			const start = new Date(nextMonday);
			start.setDate(start.getDate() + i * 7);
			const end = new Date(start);
			end.setDate(end.getDate() + 6);

			/* Format as YYYY-MM-DD */
			const startStr = start.toISOString().slice(0, 10);
			const endStr = end.toISOString().slice(0, 10);

			const week = await createScheduleWeek(weekNum, startStr, endStr);

			/* Initialize availability for all players (default = available) */
			await initializeWeekAvailability(week.id);

			createdWeeks.push(week);
		}

		await logAction(adminEmail, "generate_schedule_weeks", "schedule", null, null, {
			weeks: createdWeeks.map((w) => ({ id: w.id, week_number: w.week_number, start_date: w.start_date })),
		});

		return NextResponse.json({
			success: true,
			message: `${createdWeeks.length} semanas creadas.`,
			weeks: createdWeeks,
		});
	} catch (err) {
		console.error("Error generating schedule weeks:", err);
		return NextResponse.json(
			{ error: "Error al generar semanas." },
			{ status: 500 }
		);
	}
}
