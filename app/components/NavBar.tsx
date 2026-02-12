"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Navigation bar — liquid glass style with pill-shaped links.
 * Responsive with hamburger menu on mobile.
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
		<header className="lg-wrap lg-nav">
			{/* Brand */}
			<Link className="lg-brand" href="/" aria-label="Inicio">
				<div className="lg-logo" aria-hidden="true" />
				<div>
					<b>Highlander</b>
					<small>Torneo de Tenis</small>
				</div>
			</Link>

			{/* Desktop links */}
			<nav className="lg-links hidden md:flex" aria-label="Navegacion">
				{NAV_LINKS.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={`lg-pill ${
							pathname.startsWith(link.href) ? "lg-pill-active" : ""
						}`}
					>
						{link.label}
					</Link>
				))}
				<Link
					href="/admin"
					className={`lg-pill ${
						pathname.startsWith("/admin") ? "lg-pill-primary" : ""
					}`}
				>
					Admin
				</Link>
			</nav>

			{/* Mobile hamburger */}
			<button
				onClick={() => setMenuOpen(!menuOpen)}
				className="lg-pill md:hidden"
				aria-label="Abrir menu"
			>
				<svg
					width="20"
					height="20"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					{menuOpen ? (
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					) : (
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					)}
				</svg>
			</button>

			{/* Mobile menu overlay */}
			{menuOpen && (
				<nav
					className="absolute top-full left-0 right-0 z-20 p-4 flex flex-col gap-2 md:hidden"
					style={{
						background: "rgba(7,10,18,.92)",
						backdropFilter: "blur(18px)",
						WebkitBackdropFilter: "blur(18px)",
					}}
				>
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							onClick={() => setMenuOpen(false)}
							className={`lg-pill ${
								pathname.startsWith(link.href) ? "lg-pill-active" : ""
							}`}
							style={{ textAlign: "center" }}
						>
							{link.label}
						</Link>
					))}
					<Link
						href="/admin"
						onClick={() => setMenuOpen(false)}
						className={`lg-pill ${
							pathname.startsWith("/admin") ? "lg-pill-primary" : ""
						}`}
						style={{ textAlign: "center" }}
					>
						Admin
					</Link>
				</nav>
			)}
		</header>
	);
}
