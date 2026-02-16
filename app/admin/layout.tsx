import { getAdminSession } from "@/lib/auth";
import AdminLoginButton from "./AdminLoginButton";
import AdminNav from "./AdminNav";

/**
 * Admin layout — auth gate with v0 glass styling.
 *
 * Uses Google OAuth via NextAuth. Shows login button if not authenticated,
 * otherwise shows the admin nav with the user's name/email.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getAdminSession();

	if (!session) {
		return (
			<div className="grid gap-5">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Panel de Administracion
				</h1>
				<AdminLoginButton />
			</div>
		);
	}

	/* Extract admin display name — prefer Google name, fallback to email */
	const displayName = session.user?.name ?? session.user?.email ?? "Admin";

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
						Admin
					</h1>
					<p className="text-xs text-muted-foreground">
						{displayName}
					</p>
				</div>
				<AdminNav />
			</div>
			{children}
		</div>
	);
}
