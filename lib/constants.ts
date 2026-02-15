/**
 * Shared constants for the tournament app.
 * Centralises magic strings so they're easy to find and update.
 */

/* ── Player categories ── */
export const CATEGORY_MALE = "M" as const;
export const CATEGORY_FEMALE = "F" as const;
export type Category = typeof CATEGORY_MALE | typeof CATEGORY_FEMALE;

/** Human-readable labels for each category */
export const CATEGORY_LABELS: Record<Category, { full: string; short: string }> = {
	[CATEGORY_MALE]: { full: "Masculino", short: "Masc" },
	[CATEGORY_FEMALE]: { full: "Femenino", short: "Fem" },
};

/* ── Tournament phases ── */
export const PHASE_ROUND_ROBIN = "round_robin" as const;
export const PHASE_BRACKET = "bracket" as const;
export type Phase = typeof PHASE_ROUND_ROBIN | typeof PHASE_BRACKET;

/** Human-readable labels for each phase */
export const PHASE_LABELS: Record<Phase, { full: string; short: string }> = {
	[PHASE_ROUND_ROBIN]: { full: "Fase 1 — Round Robin", short: "Fase 1" },
	[PHASE_BRACKET]: { full: "Fase 2 — Eliminación", short: "Fase 2" },
};

/* ── Bracket configuration ── */

/** Number of players that qualify from each category into the bracket */
export const BRACKET_QUALIFIERS = 4;

/** Bracket round identifiers and labels */
export const BRACKET_ROUND_SEMIFINAL = "semifinal" as const;
export const BRACKET_ROUND_FINAL = "final" as const;
export const BRACKET_ROUND_THIRD_PLACE = "third_place" as const;
export type BracketRound =
	| typeof BRACKET_ROUND_SEMIFINAL
	| typeof BRACKET_ROUND_FINAL
	| typeof BRACKET_ROUND_THIRD_PLACE;

export const BRACKET_ROUND_LABELS: Record<BracketRound, string> = {
	[BRACKET_ROUND_SEMIFINAL]: "Semifinal",
	[BRACKET_ROUND_FINAL]: "Final",
	[BRACKET_ROUND_THIRD_PLACE]: "3er Puesto",
};

/* ── Match statuses ── */
export const STATUS_PENDING = "pendiente" as const;
export const STATUS_PLAYED = "jugado" as const;
export type MatchStatus = typeof STATUS_PENDING | typeof STATUS_PLAYED;

/** Human-readable labels for each status */
export const STATUS_LABELS: Record<MatchStatus, { full: string; short: string }> = {
	[STATUS_PENDING]: { full: "Pendientes", short: "Pend" },
	[STATUS_PLAYED]: { full: "Jugados", short: "Jug" },
};

/* ── Score validation ── */

/**
 * Regular set: "6-4", "7-5", "7-6", etc. Games range 0–7.
 */
const REGULAR_SET_RE = /^\d{1,2}-\d{1,2}$/;

/**
 * Super-tiebreak: "[10-7]", "[12-10]", etc.
 */
const SUPER_TIEBREAK_RE = /^\[\d{1,2}-\d{1,2}\]$/;

/**
 * Validates a tennis score string.
 *
 * Accepted formats:
 * - "6-4, 6-2"            (straight sets)
 * - "6-4, 3-6, 7-5"       (three regular sets)
 * - "6-4, 3-6, [10-7]"    (two sets + super-tiebreak)
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateScore(score: string): string | null {
	const sets = score.split(",").map((s) => s.trim());

	if (sets.length < 2 || sets.length > 3) {
		return "El marcador debe tener 2 o 3 sets.";
	}

	/* First two must be regular sets */
	for (let i = 0; i < 2; i++) {
		if (!REGULAR_SET_RE.test(sets[i])) {
			return `Set ${i + 1} tiene formato inválido: "${sets[i]}".`;
		}
	}

	/* Optional third set: regular or super-tiebreak */
	if (sets.length === 3) {
		if (!REGULAR_SET_RE.test(sets[2]) && !SUPER_TIEBREAK_RE.test(sets[2])) {
			return `Set 3 tiene formato inválido: "${sets[2]}".`;
		}
	}

	return null;
}

/* ── Category badge styling ── */

/**
 * Returns Tailwind classes for a category badge.
 * Male → blue (cat-male), Female → pink (cat-female).
 */
export function categoryBadgeClass(category: Category): string {
	return category === CATEGORY_MALE
		? "bg-cat-male/15 text-cat-male ring-cat-male/25"
		: "bg-cat-female/15 text-cat-female ring-cat-female/25";
}

/* ── Tournament info (easy to update when final names/dates are confirmed) ── */
export const TOURNAMENT_NAME = "Colinas Invitational";
export const TOURNAMENT_DATES = "6 de Abril – 30 de Junio, 2026";
