/**
 * /api/matches
 *
 * GET  — List matches (optional ?category=M|F&status=pendiente|jugado)
 * POST — Generate round-robin for a category (requires admin session)
 *        Body: { category: 'M' | 'F' }
 */
import { NextRequest, NextResponse } from "next/server";
import { getMatches, generateRoundRobin } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const category = request.nextUrl.searchParams.get("category") || undefined;
		const status = request.nextUrl.searchParams.get("status") || undefined;
		const matches = await getMatches(category, status);
		return NextResponse.json(matches);
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener partidos." },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		if (!(await isAuthenticated())) {
			return NextResponse.json(
				{ error: "No autorizado." },
				{ status: 401 }
			);
		}

		const { category } = await request.json();

		if (category !== "M" && category !== "F") {
			return NextResponse.json(
				{ error: "Categoría debe ser 'M' o 'F'." },
				{ status: 400 }
			);
		}

		const count = await generateRoundRobin(category);
		return NextResponse.json({
			success: true,
			message: `${count} partidos generados para categoría ${category === "M" ? "Masculino" : "Femenino"}.`,
			count,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al generar partidos." },
			{ status: 500 }
		);
	}
}
