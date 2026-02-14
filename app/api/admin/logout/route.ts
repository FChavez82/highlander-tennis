/**
 * /api/admin/logout
 *
 * POST — Clear the admin session cookie (server-side).
 */
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
	await clearSessionCookie();
	return NextResponse.json({ success: true });
}
