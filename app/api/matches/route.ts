/**
 * /api/matches
 *
 * GET  — List matches (optional ?category=M|F&status=pendiente|jugado&phase=round_robin|bracket)
 * POST — Generate round-robin or bracket for a category (requires admin session)
 *        Body: { category: 'M' | 'F' }                              — round-robin
 *        Body: { action: 'generate_bracket', category, qualifiers }  — bracket
 */
import { NextRequest, NextResponse } from "next/server";
import { getMatches, generateRoundRobin, generateBracket } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

export async function GET(request: NextRequest) {
	try {
		const category = request.nextUrl.searchParams.get("category") || undefined;
		const status = request.nextUrl.searchParams.get("status") || undefined;
		const phase = request.nextUrl.searchParams.get("phase") || undefined;
		const matches = await getMatches(category, status, phase);
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

		const body = (await request.json()) as Record<string, unknown>;
		const { category, action } = body;

		if (category !== CATEGORY_MALE && category !== CATEGORY_FEMALE) {
			return NextResponse.json(
				{ error: `Categoría debe ser '${CATEGORY_MALE}' o '${CATEGORY_FEMALE}'.` },
				{ status: 400 }
			);
		}

		const validCategory = category as Category;

		/* ── Generate bracket from standings ── */
		if (action === "generate_bracket") {
			const qualifiers = typeof body.qualifiers === "number" ? body.qualifiers : 4;

			try {
				const result = await generateBracket(validCategory, qualifiers);
				return NextResponse.json({
					success: true,
					message: `Llaves generadas para ${CATEGORY_LABELS[validCategory].full}: ${result.created} partidos creados.`,
					...result,
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : "Error al generar llaves.";
				return NextResponse.json(
					{ error: message },
					{ status: 400 }
				);
			}
		}

		/* ── Default: generate round-robin ── */
		const count = await generateRoundRobin(validCategory);
		return NextResponse.json({
			success: true,
			message: `${count} partidos generados para categoría ${CATEGORY_LABELS[validCategory].full}.`,
			count,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al generar partidos." },
			{ status: 500 }
		);
	}
}
