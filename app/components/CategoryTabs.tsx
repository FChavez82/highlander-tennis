"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORY_MALE, CATEGORY_FEMALE, CATEGORY_LABELS, type Category } from "@/lib/constants";

/**
 * Pill-style M/F tab switcher.
 * Uses URL search params (?cat=M / ?cat=F) instead of useState,
 * enabling deep-linking and keeping parent components as server components.
 */

const pillBase =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors bg-[hsl(210_20%_80%/0.06)] text-secondary-foreground glass-interactive";
const pillActive =
	"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary ring-1 ring-primary/30 glass-interactive";

export default function CategoryTabs({
	maleCount,
	femaleCount,
}: {
	maleCount: number;
	femaleCount: number;
}) {
	const searchParams = useSearchParams();
	const currentCat = (searchParams.get("cat") as Category) || CATEGORY_MALE;

	return (
		<div className="flex gap-2.5" role="tablist" aria-label="Categoria">
			<Link
				href={`?cat=${CATEGORY_MALE}`}
				scroll={false}
				role="tab"
				aria-selected={currentCat === CATEGORY_MALE}
				className={currentCat === CATEGORY_MALE ? pillActive : pillBase}
			>
				{CATEGORY_LABELS[CATEGORY_MALE].full} ({maleCount})
			</Link>
			<Link
				href={`?cat=${CATEGORY_FEMALE}`}
				scroll={false}
				role="tab"
				aria-selected={currentCat === CATEGORY_FEMALE}
				className={currentCat === CATEGORY_FEMALE ? pillActive : pillBase}
			>
				{CATEGORY_LABELS[CATEGORY_FEMALE].full} ({femaleCount})
			</Link>
		</div>
	);
}
