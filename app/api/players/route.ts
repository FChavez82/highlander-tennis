/**
 * /api/players
 *
 * GET  — List all players (optional ?category=M|F)
 * POST — Create a new player (requires admin session)
 *        Body: { name: string, category: 'M' | 'F' }
 */
import { NextRequest, NextResponse } from "next/server";
import { getPlayers, createPlayer } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const category = request.nextUrl.searchParams.get("category") || undefined;
		const players = await getPlayers(category);
		return NextResponse.json(players);
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener jugadores." },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		/* Verify admin authentication */
		if (!(await isAuthenticated())) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		const { name, category } = await request.json();

		if (!name || !category) {
			return NextResponse.json(
				{ error: "Nombre y categoría son requeridos." },
				{ status: 400 }
			);
		}

		if (category !== "M" && category !== "F") {
			return NextResponse.json(
				{ error: "Categoría debe ser 'M' o 'F'." },
				{ status: 400 }
			);
		}

		const player = await createPlayer(name.trim(), category);
		return NextResponse.json(player, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Error al crear jugador." },
			{ status: 500 }
		);
	}
}
