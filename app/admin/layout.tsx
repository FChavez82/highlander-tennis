import { isAuthenticated } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";
import AdminNav from "./AdminNav";

/**
 * Admin layout — auth gate with liquid glass styling.
 */
export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const authed = await isAuthenticated();

	if (!authed) {
		return (
			<div style={{ display: "grid", gap: 16 }}>
				<h1 className="lg-h1">Panel de Administracion</h1>
				<AdminLoginForm />
			</div>
		);
	}

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
				<h1 className="lg-h1" style={{ margin: 0 }}>Admin</h1>
				<AdminNav />
			</div>
			{children}
		</div>
	);
}
