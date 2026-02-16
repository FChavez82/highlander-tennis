/**
 * Loading skeleton for /resultados — shows placeholder cards while data streams.
 */
export default function ResultadosLoading() {
	return (
		<div className="grid gap-5">
			<div className="h-9 w-44 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
			<div className="flex gap-2">
				<div className="h-9 w-20 animate-pulse rounded-xl bg-[hsl(210_20%_80%/0.08)]" />
				<div className="h-9 w-20 animate-pulse rounded-xl bg-[hsl(210_20%_80%/0.08)]" />
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,max-content))] gap-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="glass rounded-2xl p-3">
						<div className="mb-2.5 flex items-center justify-between">
							<div className="h-5 w-12 animate-pulse rounded-md bg-[hsl(210_20%_80%/0.08)]" />
							<div className="h-4 w-20 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
						</div>
						<div className="grid gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
							<div className="h-4 w-24 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
