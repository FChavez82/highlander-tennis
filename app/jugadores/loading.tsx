/**
 * Loading skeleton for /jugadores — shows placeholder rows while data streams.
 */
export default function JugadoresLoading() {
	return (
		<div className="grid gap-5">
			<div className="h-9 w-44 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
			<div className="flex gap-2.5">
				<div className="h-8 w-28 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
				<div className="h-8 w-28 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
			</div>
			<div className="glass overflow-hidden rounded-2xl">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 border-b border-[hsl(210_20%_40%/0.06)] px-4 py-3"
					>
						<div className="h-7 w-7 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
						<div className="h-4 w-32 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
						<div className="ml-auto flex gap-6">
							<div className="h-4 w-8 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
							<div className="h-4 w-8 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
