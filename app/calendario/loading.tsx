/**
 * Loading skeleton for /calendario — shows placeholder calendar grid while data streams.
 */
export default function CalendarioLoading() {
	return (
		<div className="grid gap-5">
			<div className="h-9 w-44 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
			<div className="flex gap-2">
				<div className="h-8 w-16 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
				<div className="h-8 w-16 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
				<div className="h-8 w-16 animate-pulse rounded-lg bg-[hsl(210_20%_80%/0.08)]" />
			</div>
			<div className="glass rounded-2xl p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between">
					<div className="h-5 w-5 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
					<div className="h-6 w-32 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
					<div className="h-5 w-5 animate-pulse rounded bg-[hsl(210_20%_80%/0.08)]" />
				</div>
				<div className="grid grid-cols-7 gap-1">
					{Array.from({ length: 35 }).map((_, i) => (
						<div
							key={i}
							className="flex h-11 items-center justify-center rounded-lg animate-pulse bg-[hsl(210_20%_80%/0.04)]"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
