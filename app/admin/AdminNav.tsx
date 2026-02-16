"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Admin sub-navigation — v0 pill style.
 * Uses NextAuth's signOut() instead of a manual logout endpoint.
 */
const ADMIN_LINKS = [
	{ href: "/admin", label: "Dashboard", exact: true },
	{ href: "/admin/jugadores", label: "Jugadores", exact: false },
	{ href: "/admin/resultados", label: "Resultados", exact: false },
	{ href: "/admin/logs", label: "Logs", exact: false },
];

/** Pill base */
const pillBase =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
/** Pill active */
const pillActive =
	"rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

export default function AdminNav() {
	const pathname = usePathname();

	return (
		<div className="flex flex-wrap items-center gap-2">
			{ADMIN_LINKS.map((link) => {
				const isActive = link.exact
					? pathname === link.href
					: pathname.startsWith(link.href);

				return (
					<Link
						key={link.href}
						href={link.href}
						className={isActive ? pillActive : pillBase}
					>
						{link.label}
					</Link>
				);
			})}
			<button
				onClick={() => signOut({ callbackUrl: "/admin" })}
				className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/20 glass-interactive"
			>
				<LogOut className="h-3.5 w-3.5" />
				Salir
			</button>
		</div>
	);
}
