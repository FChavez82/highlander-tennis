/**
 * /api/schedule/[weekId]/generate
 *
 * POST — Run the matching algorithm for a specific week.
 *        Deletes any existing matches for the week first (safe to re-generate).
 *        Creates pairings per category, respecting availability and no-duplicate constraints.
 */
import { NextRequest, NextResponse } from "next/server";
import {
	getScheduleWeekById,
	getWeekAvailability,
	deleteMatchesByWeek,
	createScheduledMatch,
} from "@/lib/db";
import { generateWeekPairings } from "@/lib/scheduler";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { CATEGORY_MALE, CATEGORY_FEMALE, WEEK_STATUS_DRAFT, type Category } from "@/lib/constants";

export async function POST(
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

		const week = await getScheduleWeekById(weekId);
		if (!week) {
			return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });
		}

		/* Only allow generating matches for draft weeks */
		if (week.status !== WEEK_STATUS_DRAFT) {
			return NextResponse.json(
				{ error: "Solo se pueden generar partidos para semanas en borrador." },
				{ status: 400 }
			);
		}

		/* Clear any previous matches for this week (safe re-generation) */
		await deleteMatchesByWeek(weekId);

		/* Get availability for all players this week */
		const availability = await getWeekAvailability(weekId);

		/* Run the algorithm for each category */
		const categories: Category[] = [CATEGORY_MALE, CATEGORY_FEMALE];
		const results: Record<string, { matchCount: number; bye: number | null; unpairedCount: number }> = {};

		for (const cat of categories) {
			/* Filter to available players in this category */
			const availableIds = availability
				.filter((a) => a.player_category === cat && a.available)
				.map((a) => a.player_id);

			const output = await generateWeekPairings({
				weekId,
				category: cat,
				availablePlayerIds: availableIds,
			});

			/* Insert pairings as matches */
			for (const pair of output.pairings) {
				await createScheduledMatch(pair.playerAId, pair.playerBId, cat, weekId);
			}

			results[cat] = {
				matchCount: output.pairings.length,
				bye: output.bye,
				unpairedCount: output.unpairedIds.length,
			};
		}

		const adminEmail = session.user?.email ?? "unknown";
		await logAction(adminEmail, "generate_week_matches", "schedule", weekId, null, {
			week_number: week.week_number,
			results,
		});

		return NextResponse.json({
			success: true,
			message: `Partidos generados para Semana ${week.week_number}.`,
			results,
		});
	} catch (err) {
		console.error("Error generating week matches:", err);
		return NextResponse.json(
			{ error: "Error al generar partidos." },
			{ status: 500 }
		);
	}
}
