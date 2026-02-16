/**
 * /api/matches/[id]
 *
 * PUT    — Update match result (requires admin session)
 *          Body: { score: string, date_played: string }
 *          After updating a bracket match, auto-advances winners/losers to the next round.
 * DELETE — Delete a match (requires admin session)
 */
import { NextRequest, NextResponse } from "next/server";
import { updateMatch, deleteMatch, resetMatch, advanceBracket, getMatchById } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { validateScore } from "@/lib/constants";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getAdminSession();
		if (!session) {
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

		const adminEmail = session.user?.email ?? "unknown";
		const body = await request.json();

		/* Snapshot match BEFORE any changes for audit trail */
		const prevMatch = await getMatchById(matchId);

		/* If reset=true, clear the match result */
		if (body.reset) {
			const match = await resetMatch(matchId);

			await logAction(adminEmail, "reset_match", "match", matchId, prevMatch ? {
				score: prevMatch.score, status: prevMatch.status, date_played: prevMatch.date_played,
			} : null, { score: null, status: match.status, date_played: null });

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

		await logAction(adminEmail, "update_match", "match", matchId, prevMatch ? {
			score: prevMatch.score, status: prevMatch.status, date_played: prevMatch.date_played,
		} : null, { score: match.score, status: match.status, date_played: match.date_played });

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
		const session = await getAdminSession();
		if (!session) {
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

		/* Snapshot match BEFORE delete for audit trail */
		const prevMatch = await getMatchById(matchId);

		await deleteMatch(matchId);

		await logAction(
			session.user?.email ?? "unknown",
			"delete_match",
			"match",
			matchId,
			prevMatch ? {
				player_a_id: prevMatch.player_a_id, player_b_id: prevMatch.player_b_id,
				score: prevMatch.score, status: prevMatch.status, category: prevMatch.category,
			} : null,
			null
		);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar partido." },
			{ status: 500 }
		);
	}
}
