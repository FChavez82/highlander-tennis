import { Loader2 } from "lucide-react";

/**
 * Root loading state — shown while server components are streaming.
 * Uses a centered spinner with the glass card style.
 */
export default function Loading() {
	return (
		<div className="flex items-center justify-center py-20">
			<div className="glass flex flex-col items-center gap-4 rounded-2xl px-10 py-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Cargando...</p>
			</div>
		</div>
	);
}
