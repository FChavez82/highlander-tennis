"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Trophy, Menu, X } from "lucide-react";
import { TOURNAMENT_NAME } from "@/lib/constants";

/**
 * Navigation bar — glass-strong sticky header with pill links.
 * Responsive with hamburger menu on mobile.
 */

const NAV_LINKS = [
	{ href: "/", label: "Inicio" },
	{ href: "/reglas", label: "Reglas" },
	{ href: "/jugadores", label: "Jugadores" },
	{ href: "/clasificacion", label: "Clasificacion" },
	{ href: "/resultados", label: "Resultados" },
	{ href: "/calendario", label: "Calendario" },
];

/** Inactive pill style */
const pillBase =
	"rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

/** Active pill style */
const pillActive =
	"rounded-lg px-4 py-2 text-sm font-medium bg-primary/20 text-primary ring-1 ring-primary/30";

export default function NavBar() {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 glass-strong">
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
				{/* Brand */}
				<Link className="flex items-center gap-3 text-foreground no-underline" href="/" aria-label="Inicio">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/60 to-accent/40 ring-1 ring-white/10">
						<Trophy className="h-5 w-5 text-white" />
					</div>
					<div>
						<span className="font-display text-lg font-bold uppercase tracking-wide">{TOURNAMENT_NAME}</span>
						<span className="block text-xs text-muted-foreground">Torneo de Tenis</span>
					</div>
				</Link>

				{/* Desktop links */}
				<nav className="hidden items-center gap-2 md:flex" aria-label="Navegacion">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={(link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)) ? pillActive : pillBase}
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
			</div>

			{/* Mobile menu overlay */}
			{menuOpen && (
				<nav
					className="border-t border-[hsl(210_20%_40%/0.12)] px-4 pb-4 pt-2 md:hidden"
					aria-label="Navegacion movil"
				>
					<div className="flex flex-col gap-1">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMenuOpen(false)}
								className={`text-center ${(link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)) ? pillActive : pillBase}`}
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
		</header>
	);
}
