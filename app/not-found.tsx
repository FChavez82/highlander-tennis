import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * Custom 404 page — shown when a route or resource is not found.
 */
export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
				<SearchX className="h-8 w-8 text-primary" />
			</div>
			<h2 className="font-display text-2xl font-bold uppercase tracking-wide">
				Pagina no encontrada
			</h2>
			<p className="max-w-md text-sm text-muted-foreground">
				La pagina que buscas no existe o fue movida.
			</p>
			<Link
				href="/"
				className="rounded-lg bg-primary/20 px-6 py-3 text-sm font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/30"
			>
				Volver al inicio
			</Link>
		</div>
	);
}
