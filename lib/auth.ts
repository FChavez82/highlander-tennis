/**
 * Admin authentication helpers — Google OAuth via NextAuth.
 *
 * Replaces the old password-based auth. Uses getServerSession
 * to check for a valid Google OAuth session, restricted to
 * whitelisted emails in ADMIN_EMAILS env var.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

/**
 * Get the current admin session (or null if not authenticated).
 * Use this when you need access to the session data (email, name).
 */
export async function getAdminSession() {
	return getServerSession(authOptions);
}

/**
 * Simple boolean check — is the current request from an authenticated admin?
 * Backwards-compatible wrapper used by existing layout/API checks.
 */
export async function isAuthenticated(): Promise<boolean> {
	const session = await getAdminSession();
	return session !== null;
}
