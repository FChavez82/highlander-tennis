import Link from "next/link";
import { Trophy } from "lucide-react";
import { TOURNAMENT_NAME } from "@/lib/constants";
import NavLinks from "./NavLinks";

/**
 * Navigation bar — glass-strong sticky header with pill links.
 * Server component: only the interactive NavLinks part is client-side.
 */
export default function NavBar() {
	return (
		<header className="sticky top-0 z-50 glass-strong">
			<div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
				{/* Brand — fully server-rendered */}
				<Link className="flex items-center gap-3 text-foreground no-underline" href="/" aria-label="Inicio">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/60 to-accent/40 ring-1 ring-white/10">
						<Trophy className="h-5 w-5 text-white" />
					</div>
					<div>
						<span className="font-display text-lg font-bold uppercase tracking-wide">{TOURNAMENT_NAME}</span>
						<span className="block text-xs text-muted-foreground">Torneo de Tenis</span>
					</div>
				</Link>

				{/* Interactive nav — client component */}
				<NavLinks />
			</div>
		</header>
	);
}
