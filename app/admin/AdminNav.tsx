"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Admin sub-navigation — liquid glass pills.
 */
const ADMIN_LINKS = [
	{ href: "/admin", label: "Dashboard", exact: true },
	{ href: "/admin/jugadores", label: "Jugadores", exact: false },
	{ href: "/admin/resultados", label: "Resultados", exact: false },
];

export default function AdminNav() {
	const pathname = usePathname();
	const router = useRouter();

	async function handleLogout() {
		document.cookie = "admin-session=; path=/; max-age=0";
		router.refresh();
	}

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
			{ADMIN_LINKS.map((link) => {
				const isActive = link.exact
					? pathname === link.href
					: pathname.startsWith(link.href);

				return (
					<Link
						key={link.href}
						href={link.href}
						className={`lg-pill ${isActive ? "lg-pill-active" : ""}`}
					>
						{link.label}
					</Link>
				);
			})}
			<button
				onClick={handleLogout}
				className="lg-pill"
				style={{ color: "#f87171" }}
			>
				Salir
			</button>
		</div>
	);
}
