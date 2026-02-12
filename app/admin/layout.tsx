import { isAuthenticated } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";
import AdminNav from "./AdminNav";

/**
 * Admin layout — wraps all /admin/* pages with an auth gate.
 * If not authenticated, shows the login form instead of the page content.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const authed = await isAuthenticated();

	if (!authed) {
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold text-court-800">
					Panel de Administración
				</h1>
				<AdminLoginForm />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-3xl font-bold text-court-800">
					Panel de Administración
				</h1>
				<AdminNav />
			</div>
			{children}
		</div>
	);
}
