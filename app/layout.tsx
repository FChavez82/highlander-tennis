import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import ShaderBackground from "./components/ShaderBackground";
import { Trophy } from "lucide-react";
import { TOURNAMENT_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
	title: `${TOURNAMENT_NAME} — Torneo de Tenis`,
	description: `Torneo round-robin de tenis ${TOURNAMENT_NAME}`,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es" className={`${inter.variable} ${oswald.variable}`}>
			<body className="min-h-screen overflow-x-hidden">
				{/* Animated WebGL shader background */}
				<ShaderBackground />

				<NavBar />

				<main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
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
			</body>
		</html>
	);
}
