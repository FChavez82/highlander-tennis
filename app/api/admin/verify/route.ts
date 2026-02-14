/**
 * POST /api/admin/verify
 *
 * Verifies the admin password and sets a session cookie on success.
 * Rate-limited to 5 attempts per IP per 15-minute window.
 * Body: { password: string }
 */
import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/** Max login attempts per IP before locking out */
const MAX_ATTEMPTS = 5;
/** Window duration: 15 minutes */
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
	try {
		/* Rate limit by IP address */
		const forwarded = request.headers.get("x-forwarded-for");
		const ip = forwarded?.split(",")[0].trim() ?? "unknown";
		const limit = rateLimit(ip, MAX_ATTEMPTS, WINDOW_MS);

		if (!limit.allowed) {
			const retryMinutes = Math.ceil(limit.retryAfterMs / 60_000);
			return NextResponse.json(
				{ error: `Demasiados intentos. Intenta de nuevo en ${retryMinutes} minuto${retryMinutes !== 1 ? "s" : ""}.` },
				{ status: 429 }
			);
		}

		const { password } = await request.json();

		if (!password) {
			return NextResponse.json(
				{ error: "Contraseña requerida." },
				{ status: 400 }
			);
		}

		if (!verifyPassword(password)) {
			return NextResponse.json(
				{ error: `Contraseña incorrecta. ${limit.remaining} intento${limit.remaining !== 1 ? "s" : ""} restante${limit.remaining !== 1 ? "s" : ""}.` },
				{ status: 401 }
			);
		}

		/* Password is correct — set session cookie */
		await setSessionCookie();

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al verificar contraseña." },
			{ status: 500 }
		);
	}
}
