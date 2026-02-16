/**
 * NextAuth catch-all API route.
 *
 * Handles /api/auth/signin, /api/auth/signout, /api/auth/callback, etc.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
