import { isAuthenticated } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";
import AdminNav from "./AdminNav";

/**
 * Admin layout — auth gate with v0 glass styling.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const authed = await isAuthenticated();

	if (!authed) {
		return (
			<div className="grid gap-5">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Panel de Administracion
				</h1>
				<AdminLoginForm />
			</div>
		);
	}

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
					Admin
				</h1>
				<AdminNav />
			</div>
			{children}
		</div>
	);
}
