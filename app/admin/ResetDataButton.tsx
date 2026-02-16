"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * Two-step destructive button to wipe all tournament data.
 *
 * Flow: idle → confirming (5s timeout) → loading → done
 * After success, refreshes the page so dashboard stats update.
 */
export default function ResetDataButton() {
	const router = useRouter();
	const [state, setState] = useState<"idle" | "confirming" | "loading" | "done">("idle");

	/* Auto-reset the confirmation after 5 seconds if user doesn't confirm */
	useEffect(() => {
		if (state !== "confirming") return;
		const timer = setTimeout(() => setState("idle"), 5000);
		return () => clearTimeout(timer);
	}, [state]);

	async function handleClick() {
		/* First click: ask for confirmation */
		if (state === "idle") {
			setState("confirming");
			return;
		}

		/* Second click: actually reset */
		if (state === "confirming") {
			setState("loading");
			try {
				const res = await fetch("/api/admin/reset", { method: "POST" });
				if (res.ok) {
					setState("done");
					/* Brief feedback before refreshing */
					setTimeout(() => {
						router.refresh();
						setState("idle");
					}, 1500);
				} else {
					const data = await res.json();
					alert(data.error || "Error al reiniciar datos.");
					setState("idle");
				}
			} catch {
				alert("Error de conexion.");
				setState("idle");
			}
		}
	}

	/* Label and style vary by state */
	const label = {
		idle: "Reiniciar Datos",
		confirming: "Estas seguro? Click para confirmar",
		loading: "Eliminando...",
		done: "Datos eliminados",
	}[state];

	const isDisabled = state === "loading" || state === "done";

	return (
		<button
			onClick={handleClick}
			disabled={isDisabled}
			className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50 ${
				state === "confirming"
					? "animate-pulse bg-destructive text-destructive-foreground"
					: state === "done"
						? "bg-primary/20 text-primary"
						: "bg-destructive/10 text-destructive hover:bg-destructive/20"
			}`}
		>
			<Trash2 className="h-4 w-4" />
			{label}
		</button>
	);
}
