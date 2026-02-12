/**
 * POST /api/admin/verify
 *
 * Verifies the admin password and sets a session cookie on success.
 * Body: { password: string }
 */
import { NextResponse } from "next/server";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
	try {
		const { password } = await request.json();

		if (!password) {
			return NextResponse.json(
				{ error: "Contraseña requerida." },
				{ status: 400 }
			);
		}

		if (!verifyPassword(password)) {
			return NextResponse.json(
				{ error: "Contraseña incorrecta." },
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
