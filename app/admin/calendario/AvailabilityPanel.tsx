"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX } from "lucide-react";
import {
	CATEGORY_MALE,
	CATEGORY_FEMALE,
	CATEGORY_LABELS,
	categoryBadgeClass,
	type Category,
} from "@/lib/constants";
import type { PlayerAvailability } from "@/lib/db";

/**
 * Expandable panel showing all players grouped by category,
 * with toggle checkboxes for availability.
 * Only editable when the week is in draft status.
 */
export default function AvailabilityPanel({
	weekId,
	availability,
	isDraft,
}: {
	weekId: number;
	availability: PlayerAvailability[];
	isDraft: boolean;
}) {
	const router = useRouter();
	const [toggling, setToggling] = useState<number | null>(null);

	/* Toggle a player's availability via the API */
	async function handleToggle(playerId: number, currentAvailable: boolean) {
		setToggling(playerId);
		try {
			const res = await fetch(`/api/schedule/${weekId}/availability`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ player_id: playerId, available: !currentAvailable }),
			});
			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Error al actualizar disponibilidad.");
				return;
			}
			router.refresh();
		} catch {
			alert("Error de conexion.");
		} finally {
			setToggling(null);
		}
	}

	/* Group players by category */
	const categories: Category[] = [CATEGORY_MALE, CATEGORY_FEMALE];

	return (
		<div className="border-t border-[hsl(210_20%_40%/0.08)] px-5 py-4">
			<div className="grid gap-4 sm:grid-cols-2">
				{categories.map((cat) => {
					const players = availability.filter((a) => a.player_category === cat);
					const availableCount = players.filter((a) => a.available).length;

					return (
						<div key={cat}>
							{/* Category header */}
							<div className="mb-2 flex items-center gap-2">
								<span
									className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ring-1 ${categoryBadgeClass(cat)}`}
								>
									{CATEGORY_LABELS[cat].full}
								</span>
								<span className="text-xs text-muted-foreground">
									{availableCount}/{players.length} disponibles
								</span>
							</div>

							{/* Player list */}
							<div className="grid gap-1">
								{players.map((player) => {
									const isToggling = toggling === player.player_id;

									return (
										<button
											key={player.player_id}
											onClick={() =>
												isDraft && handleToggle(player.player_id, player.available)
											}
											disabled={!isDraft || isToggling}
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
												player.available
													? "bg-emerald-500/[0.06] text-foreground hover:bg-emerald-500/[0.12]"
													: "bg-destructive/[0.06] text-muted-foreground hover:bg-destructive/[0.12]"
											} ${!isDraft ? "cursor-default opacity-60" : ""} ${isToggling ? "opacity-50" : ""}`}
										>
											{player.available ? (
												<UserCheck className="h-3.5 w-3.5 text-emerald-400" />
											) : (
												<UserX className="h-3.5 w-3.5 text-destructive" />
											)}
											<span className={player.available ? "font-medium" : "line-through"}>
												{player.player_name}
											</span>
										</button>
									);
								})}

								{players.length === 0 && (
									<div className="py-2 text-xs text-muted-foreground">
										No hay jugadores en esta categoria.
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
