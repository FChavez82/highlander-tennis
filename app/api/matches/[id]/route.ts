/**
 * /api/matches/[id]
 *
 * PUT    — Update match result (requires admin session)
 *          Body: { score: string, date_played: string }
 *          After updating a bracket match, auto-advances winners/losers to the next round.
 * DELETE — Delete a match (requires admin session)
 */
import { NextRequest, NextResponse } from "next/server";
import { updateMatch, deleteMatch, resetMatch, advanceBracket } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { validateScore } from "@/lib/constants";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		if (!(await isAuthenticated())) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const matchId = parseInt(id);
		if (isNaN(matchId)) {
			return NextResponse.json(
				{ error: "ID inválido." },
				{ status: 400 }
			);
		}

		const body = await request.json();

		/* If reset=true, clear the match result */
		if (body.reset) {
			const match = await resetMatch(matchId);
			return NextResponse.json(match);
		}

		const { score, date_played } = body;

		if (!score || !date_played) {
			return NextResponse.json(
				{ error: "Marcador y fecha son requeridos." },
				{ status: 400 }
			);
		}

		/* Validate score format before saving */
		const scoreError = validateScore(score.trim());
		if (scoreError) {
			return NextResponse.json(
				{ error: scoreError },
				{ status: 400 }
			);
		}

		const match = await updateMatch(matchId, score.trim(), date_played);

		/* Auto-advance bracket: if this was a semifinal, populate final + 3rd place */
		try {
			await advanceBracket(matchId);
		} catch {
			/* Non-fatal: bracket advance can fail if not all semis are done yet */
		}

		return NextResponse.json(match);
	} catch {
		return NextResponse.json(
			{ error: "Error al actualizar partido." },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		if (!(await isAuthenticated())) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const matchId = parseInt(id);
		if (isNaN(matchId)) {
			return NextResponse.json(
				{ error: "ID inválido." },
				{ status: 400 }
			);
		}

		await deleteMatch(matchId);
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar partido." },
			{ status: 500 }
		);
	}
}
