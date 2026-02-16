"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Small share button that copies the current page URL to clipboard.
 * Shows "Copiado!" feedback for 2 seconds after clicking.
 */
export default function ShareButton() {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* Fallback for older browsers */
			const textarea = document.createElement("textarea");
			textarea.value = window.location.href;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	return (
		<button
			onClick={handleCopy}
			aria-label={copied ? "Enlace copiado" : "Copiar enlace para compartir"}
			aria-live="polite"
			className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent ring-1 ring-accent/25 transition-colors hover:bg-accent/25"
		>
			{copied ? (
				<>
					<Check className="h-3.5 w-3.5" />
					Copiado!
				</>
			) : (
				<>
					<Share2 className="h-3.5 w-3.5" />
					Compartir
				</>
			)}
		</button>
	);
}
