import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
	title: "Highlander — Torneo de Tenis",
	description: "Torneo round-robin de tenis del club Highlander",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es">
			<body className="min-h-screen flex flex-col">
				<NavBar />
				<main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
					{children}
				</main>
				<footer className="text-center text-sm text-gray-400 py-4 border-t">
					Highlander Tennis Club &copy; {new Date().getFullYear()}
				</footer>
			</body>
		</html>
	);
}
