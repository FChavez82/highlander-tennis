"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin login form — liquid glass style.
 */
export default function AdminLoginForm() {
	const [password, setPassword] = useState("");
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
		<div className="lg-card" style={{ padding: 24, maxWidth: 420 }}>
			<p className="lg-muted" style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
				Ingresa la contrasena del director del torneo para acceder al panel de administracion.
			</p>

			<form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
				<div>
					<label htmlFor="password" style={{ display: "block", fontSize: 13, marginBottom: 6 }} className="lg-muted">
						Contrasena
					</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Ingresa la contrasena"
						className="lg-input"
						required
					/>
				</div>

				{error && (
					<div className="lg-message lg-message-error">{error}</div>
				)}

				<button type="submit" disabled={loading} className="lg-btn lg-btn-primary">
					{loading ? "Verificando..." : "Ingresar"}
				</button>
			</form>
		</div>
	);
}
