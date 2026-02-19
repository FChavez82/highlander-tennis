import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import Providers from "./components/Providers";
import { Trophy } from "lucide-react";
import { TOURNAMENT_NAME, SITE_URL } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const viewport: Viewport = {
	themeColor: "#0a1628",
	width: "device-width",
	initialScale: 1,
};

const title = `${TOURNAMENT_NAME} — Torneo de Tenis`;
const description = `Clasificacion, resultados y calendario del torneo round-robin de tenis ${TOURNAMENT_NAME}.`;

export const metadata: Metadata = {
	title,
	description,
	metadataBase: new URL(SITE_URL),
	openGraph: {
		title,
		description,
		siteName: TOURNAMENT_NAME,
		locale: "es_MX",
		type: "website",
	},
	twitter: {
		card: "summary",
		title,
		description,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es" className={`${inter.variable} ${oswald.variable}`}>
			<body className="min-h-screen overflow-x-hidden">
				<Providers>
					{/* Skip-to-content link for keyboard/screen reader users */}
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary/90 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
					>
						Ir al contenido principal
					</a>

					{/* Static gradient background — zero GPU cost */}
					<div className="gradient-bg" aria-hidden="true" />

					<NavBar />

					<main id="main-content" className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
						{children}
					</main>

					{/* Footer */}
					<footer className="mx-auto max-w-7xl px-4 pb-10 pt-6 lg:px-8">
						{/* Gradient separator */}
						<div className="mb-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
						<div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<Trophy className="h-4 w-4 text-accent" />
								<span>{TOURNAMENT_NAME} &copy; {new Date().getFullYear()}</span>
							</div>
							<span className="text-xs">Torneo Round-Robin</span>
						</div>
					</footer>
				</Providers>
			</body>
		</html>
	);
}
