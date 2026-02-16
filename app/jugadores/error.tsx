"use client";

import { AlertTriangle } from "lucide-react";

export default function JugadoresError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 ring-1 ring-destructive/25">
				<AlertTriangle className="h-8 w-8 text-destructive" />
			</div>
			<h2 className="font-display text-2xl font-bold uppercase tracking-wide">
				Error al cargar jugadores
			</h2>
			<p className="max-w-md text-sm text-muted-foreground">
				No se pudo cargar la lista de jugadores. Puede ser un problema temporal con la base de datos.
			</p>
			<button
				onClick={reset}
				className="rounded-lg bg-primary/20 px-6 py-3 text-sm font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/30"
			>
				Intentar de nuevo
			</button>
		</div>
	);
}
