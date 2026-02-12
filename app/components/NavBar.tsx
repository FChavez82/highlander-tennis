"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Navigation bar — responsive with a hamburger menu on mobile.
 * Links: Reglas, Jugadores, Resultados, Calendario, Admin.
 */

const NAV_LINKS = [
	{ href: "/reglas", label: "Reglas" },
	{ href: "/jugadores", label: "Jugadores" },
	{ href: "/resultados", label: "Resultados" },
	{ href: "/calendario", label: "Calendario" },
];

export default function NavBar() {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<nav className="bg-court-800 text-white shadow-lg">
			<div className="max-w-5xl mx-auto px-4">
				<div className="flex items-center justify-between h-14">
					{/* Logo / Brand */}
					<Link
						href="/"
						className="text-xl font-bold tracking-wide text-gold-400 hover:text-gold-500 transition-colors"
					>
						Highlander
					</Link>

					{/* Desktop links */}
					<div className="hidden md:flex items-center gap-1">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
									pathname.startsWith(link.href)
										? "bg-court-700 text-gold-400"
										: "text-gray-200 hover:bg-court-700 hover:text-white"
								}`}
							>
								{link.label}
							</Link>
						))}

						{/* Admin link — slightly separated */}
						<span className="w-px h-6 bg-court-600 mx-2" />
						<Link
							href="/admin"
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								pathname.startsWith("/admin")
									? "bg-court-700 text-gold-400"
									: "text-gray-400 hover:bg-court-700 hover:text-white"
							}`}
						>
							Admin
						</Link>
					</div>

					{/* Mobile hamburger button */}
					<button
						onClick={() => setMenuOpen(!menuOpen)}
						className="md:hidden p-2 rounded-md hover:bg-court-700 transition-colors"
						aria-label="Abrir menú"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{menuOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile menu */}
				{menuOpen && (
					<div className="md:hidden pb-3 space-y-1">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMenuOpen(false)}
								className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
									pathname.startsWith(link.href)
										? "bg-court-700 text-gold-400"
										: "text-gray-200 hover:bg-court-700 hover:text-white"
								}`}
							>
								{link.label}
							</Link>
						))}
						<Link
							href="/admin"
							onClick={() => setMenuOpen(false)}
							className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
								pathname.startsWith("/admin")
									? "bg-court-700 text-gold-400"
									: "text-gray-400 hover:bg-court-700 hover:text-white"
							}`}
						>
							Admin
						</Link>
					</div>
				)}
			</div>
		</nav>
	);
}
