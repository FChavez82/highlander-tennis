"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side providers wrapper.
 * Wraps the app with NextAuth's SessionProvider so that
 * signIn() / signOut() / useSession() work in client components.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
	return <SessionProvider>{children}</SessionProvider>;
}
