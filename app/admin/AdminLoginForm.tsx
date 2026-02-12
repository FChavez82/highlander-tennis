"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Login form for the admin panel.
 * Sends password to /api/admin/verify and reloads on success.
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
				/* Reload the page — the server layout will now see the cookie */
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error || "Contraseña incorrecta.");
			}
		} catch {
			setError("Error de conexión.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bg-white rounded-xl shadow-sm p-6 max-w-md">
			<p className="text-gray-600 mb-4">
				Ingresa la contraseña del director del torneo para acceder al
				panel de administración.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Contraseña
					</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Ingresa la contraseña"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-court-500 focus:border-court-500 outline-none"
						required
					/>
				</div>

				{error && (
					<p className="text-red-600 text-sm">{error}</p>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full bg-court-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-court-800 transition-colors disabled:opacity-50"
				>
					{loading ? "Verificando..." : "Ingresar"}
				</button>
			</form>
		</div>
	);
}
