/**
 * /api/players/[id]
 *
 * DELETE — Remove a player and their matches (requires admin session)
 */
import { NextRequest, NextResponse } from "next/server";
import { deletePlayer } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

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
		const playerId = parseInt(id);

		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: "ID inválido." },
				{ status: 400 }
			);
		}

		await deletePlayer(playerId);
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar jugador." },
			{ status: 500 }
		);
	}
}
