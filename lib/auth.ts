/**
 * Admin authentication helpers.
 *
 * Simple password-based auth: the tournament director enters a shared
 * password, which is verified against the ADMIN_PASSWORD env variable.
 * A session cookie is set on success.
 */
import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE_NAME = "admin-session";
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds

/**
 * Hash a string using SHA-256 — used to create a session token
 * from the password so we don't store the raw password in the cookie.
 */
function hashString(input: string): string {
	return createHash("sha256").update(input).digest("hex");
}

/**
 * Verify if the provided password matches the admin password.
 */
export function verifyPassword(password: string): boolean {
	const adminPassword = process.env.ADMIN_PASSWORD;
	if (!adminPassword) {
		console.error("ADMIN_PASSWORD env variable not set!");
		return false;
	}
	return password === adminPassword;
}

/**
 * Create a session token from the admin password.
 * The token is a hash of the password + a secret salt.
 */
export function createSessionToken(): string {
	const adminPassword = process.env.ADMIN_PASSWORD || "";
	return hashString(`highlander-session-${adminPassword}`);
}

/**
 * Set the admin session cookie.
 */
export async function setSessionCookie(): Promise<void> {
	const token = createSessionToken();
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: SESSION_DURATION,
		path: "/",
	});
}

/**
 * Check if the current request has a valid admin session.
 */
export async function isAuthenticated(): Promise<boolean> {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get(COOKIE_NAME);

	if (!sessionCookie) return false;

	const expectedToken = createSessionToken();
	return sessionCookie.value === expectedToken;
}

/**
 * Clear the admin session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
}
