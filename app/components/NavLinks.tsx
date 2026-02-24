"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Client-only interactive part of the navigation:
 * - Active link highlighting via usePathname()
 * - Mobile hamburger toggle via useState
 *
 * Extracted so the parent NavBar can remain a server component.
 */

const NAV_LINKS = [
	{ href: "/", label: "Inicio" },
	{ href: "/reglas", label: "Reglas" },
	{ href: "/jugadores", label: "Jugadores" },
	{ href: "/clasificacion", label: "Clasificacion" },
	{ href: "/resultados", label: "Resultados" },
	{ href: "/calendario", label: "Calendario" },
	{ href: "/partidos-semana", label: "Ronda" },
	{ href: "/suizo", label: "Suizo" },
];

/** Inactive pill style */
const pillBase =
	"rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground glass-interactive";

/** Active pill style */
const pillActive =
	"rounded-lg px-4 py-2 text-sm font-medium bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

/** Check if a link is active based on the current pathname */
function isActive(href: string, pathname: string): boolean {
	return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function NavLinks() {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<>
			{/* Desktop links */}
			<nav className="hidden items-center gap-2 md:flex" aria-label="Navegacion">
				{NAV_LINKS.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={isActive(link.href, pathname) ? pillActive : pillBase}
					>
						{link.label}
					</Link>
				))}
				<Link
					href="/admin"
					className={pathname.startsWith("/admin") ? pillActive : pillBase}
				>
					Admin
				</Link>
			</nav>

			{/* Mobile hamburger */}
			<button
				onClick={() => setMenuOpen(!menuOpen)}
				className="rounded-lg p-2 text-muted-foreground hover:text-foreground md:hidden"
				aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
			>
				{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</button>

			{/* Mobile menu overlay */}
			{menuOpen && (
				<nav
					className="absolute left-0 right-0 top-full border-t border-[hsl(210_20%_40%/0.12)] glass-strong px-4 pb-4 pt-2 md:hidden"
					aria-label="Navegacion movil"
				>
					<div className="flex flex-col gap-1">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMenuOpen(false)}
								className={`text-center ${isActive(link.href, pathname) ? pillActive : pillBase}`}
							>
								{link.label}
							</Link>
						))}
						<Link
							href="/admin"
							onClick={() => setMenuOpen(false)}
							className={`text-center ${pathname.startsWith("/admin") ? pillActive : pillBase}`}
						>
							Admin
						</Link>
					</div>
				</nav>
			)}
		</>
	);
}
