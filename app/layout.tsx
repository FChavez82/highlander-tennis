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
			<body>
				<div className="lg-bg">
					{/* Animated gradient blobs */}
					<div className="lg-blob lg-blob-1" aria-hidden="true" />
					<div className="lg-blob lg-blob-2" aria-hidden="true" />

					<NavBar />

					<main className="lg-wrap">{children}</main>

					<footer className="lg-wrap lg-footer">
						<span>Highlander Tennis Club &copy; {new Date().getFullYear()}</span>
						<span className="lg-muted">Torneo Round-Robin</span>
					</footer>
				</div>
			</body>
		</html>
	);
}
