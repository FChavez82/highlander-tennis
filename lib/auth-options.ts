/**
 * NextAuth configuration — shared between the route handler and
 * getServerSession calls throughout the app.
 *
 * Uses Google OAuth with a whitelist of admin emails.
 * Emails are stored in the ADMIN_EMAILS env var (comma-separated).
 */
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/** Parse the comma-separated whitelist of admin emails from env */
function getAdminEmails(): string[] {
	const raw = process.env.ADMIN_EMAILS ?? "";
	return raw
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],

	/* JWT strategy — no database session table needed */
	session: {
		strategy: "jwt",
	},

	callbacks: {
		/**
		 * signIn — only allow whitelisted admin emails.
		 * Returning false (or a URL string) rejects the login.
		 */
		async signIn({ user }) {
			const email = user.email?.toLowerCase();
			if (!email) return false;

			const allowed = getAdminEmails();
			if (allowed.length === 0) {
				console.error("ADMIN_EMAILS env var is empty — no one can sign in!");
				return false;
			}

			if (!allowed.includes(email)) {
				/* Redirect to a custom error page with a descriptive message */
				return "/admin?error=unauthorized";
			}

			return true;
		},

		/**
		 * session — attach email and name to the session object
		 * so we can display admin info in the UI.
		 */
		async session({ session, token }) {
			if (session.user) {
				session.user.email = token.email as string;
				session.user.name = token.name as string;
			}
			return session;
		},
	},

	pages: {
		/* Use the admin page as the sign-in page so users
		   see the branded login button instead of NextAuth's default */
		signIn: "/admin",
	},
};
