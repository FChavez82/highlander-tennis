"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

/**
 * Admin login form — v0 glass design.
 */
export default function AdminLoginForm() {
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/admin/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			if (res.ok) {
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error || "Contrasena incorrecta.");
			}
		} catch {
			setError("Error de conexion.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="glass max-w-md rounded-2xl p-6">
			<p className="mb-4 text-sm leading-relaxed text-muted-foreground">
				Ingresa la contrasena del director del torneo para acceder al panel de administracion.
			</p>

			<form onSubmit={handleSubmit} className="grid gap-3">
				<div>
					<label htmlFor="password" className="mb-1.5 block text-sm text-muted-foreground">
						Contrasena
					</label>
					<div className="relative">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Ingresa la contrasena"
							className="w-full rounded-lg border border-input bg-[hsl(210_20%_80%/0.06)] px-4 py-2.5 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</div>

				{error && (
					<div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
				>
					{loading ? "Verificando..." : "Ingresar"}
				</button>
			</form>
		</div>
	);
}
