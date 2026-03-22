import { describe, it, expect } from "vitest";
import { validateScore, categoryBadgeClass, CATEGORY_MALE, CATEGORY_FEMALE } from "../constants";

describe("validateScore", () => {
	// ── Valid inputs ────────────────────────────────────────────────────────
	it("accepts a valid two-set score", () => {
		expect(validateScore("6-4, 6-2")).toBeNull();
	});

	it("accepts a three-set score with all regular sets", () => {
		expect(validateScore("6-4, 3-6, 7-5")).toBeNull();
	});

	it("accepts a score with a super-tiebreak third set", () => {
		expect(validateScore("6-4, 3-6, [10-7]")).toBeNull();
	});

	it("accepts a tiebreak set score (7-6)", () => {
		expect(validateScore("7-6, 6-3")).toBeNull();
	});

	it("accepts double-digit scores (e.g. [12-10])", () => {
		expect(validateScore("6-4, 3-6, [12-10]")).toBeNull();
	});

	// ── Invalid: wrong number of sets ───────────────────────────────────────
	it("rejects a score with only one set", () => {
		expect(validateScore("6-4")).not.toBeNull();
	});

	it("rejects a score with four sets", () => {
		expect(validateScore("6-4, 6-2, 6-1, 6-0")).not.toBeNull();
	});

	it("rejects an empty string", () => {
		expect(validateScore("")).not.toBeNull();
	});

	// ── Invalid: malformed set format ────────────────────────────────────────
	it("rejects a non-numeric set", () => {
		expect(validateScore("abc, 6-2")).not.toBeNull();
	});

	it("rejects a score with text instead of numbers", () => {
		expect(validateScore("six-four, 6-2")).not.toBeNull();
	});

	it("rejects a super-tiebreak in set 1 position", () => {
		expect(validateScore("[10-7], 6-2")).not.toBeNull();
	});

	it("rejects a super-tiebreak in set 2 position", () => {
		expect(validateScore("6-4, [10-7], 6-2")).not.toBeNull();
	});

	// ── Error message content ────────────────────────────────────────────────
	it("returns a string error message on invalid input", () => {
		const result = validateScore("6-4");
		expect(typeof result).toBe("string");
		expect(result!.length).toBeGreaterThan(0);
	});
});

describe("categoryBadgeClass", () => {
	it("returns distinct classes for male vs female", () => {
		const male = categoryBadgeClass(CATEGORY_MALE);
		const female = categoryBadgeClass(CATEGORY_FEMALE);
		expect(male).not.toBe(female);
	});

	it("returns a non-empty string for male category", () => {
		expect(categoryBadgeClass(CATEGORY_MALE)).toBeTruthy();
	});

	it("returns a non-empty string for female category", () => {
		expect(categoryBadgeClass(CATEGORY_FEMALE)).toBeTruthy();
	});
});
