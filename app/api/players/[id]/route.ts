/**
 * /api/players/[id]
 *
 * DELETE — Remove a player and their matches (requires admin session)
 */
import { NextRequest, NextResponse } from "next/server";
import { deletePlayer, getPlayerById } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";

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
		const playerId = parseInt(id);

		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: "ID inválido." },
				{ status: 400 }
			);
		}

		/* Snapshot player BEFORE delete for audit trail */
		const player = await getPlayerById(playerId);

		await deletePlayer(playerId);

		/* Audit: log deletion with previous values */
		await logAction(
			session.user?.email ?? "unknown",
			"delete_player",
			"player",
			playerId,
			player ? { name: player.name, category: player.category } : null,
			null
		);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar jugador." },
			{ status: 500 }
		);
	}
}
