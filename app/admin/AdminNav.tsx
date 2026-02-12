"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Admin sub-navigation — links to admin sections + logout button.
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
		/* Clear the cookie by calling a simple endpoint or just deleting client-side */
		document.cookie = "admin-session=; path=/; max-age=0";
		router.refresh();
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{ADMIN_LINKS.map((link) => {
				const isActive = link.exact
					? pathname === link.href
					: pathname.startsWith(link.href);

				return (
					<Link
						key={link.href}
						href={link.href}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
							isActive
								? "bg-court-100 text-court-800"
								: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						}`}
					>
						{link.label}
					</Link>
				);
			})}

			<button
				onClick={handleLogout}
				className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ml-2"
			>
				Salir
			</button>
		</div>
	);
}
