import { describe, it, expect } from "vitest";
import { parseSets, getWinner, determineWinner, countSets } from "../score";

describe("parseSets", () => {
	it("parses a two-set score", () => {
		expect(parseSets("6-4, 6-2")).toEqual([
			{ a: 6, b: 4, isTiebreak: false },
			{ a: 6, b: 2, isTiebreak: false },
		]);
	});

	it("parses a three-set score", () => {
		expect(parseSets("6-4, 3-6, 7-5")).toEqual([
			{ a: 6, b: 4, isTiebreak: false },
			{ a: 3, b: 6, isTiebreak: false },
			{ a: 7, b: 5, isTiebreak: false },
		]);
	});

	it("parses a super-tiebreak set (bracket notation)", () => {
		const sets = parseSets("6-4, 3-6, [10-7]");
		expect(sets).toHaveLength(3);
		expect(sets[2]).toEqual({ a: 10, b: 7, isTiebreak: true });
	});

	it("returns empty array for empty string", () => {
		expect(parseSets("")).toEqual([]);
	});

	it("skips malformed set tokens", () => {
		// "abc" is not a valid set — should be filtered out
		expect(parseSets("6-4, abc, 6-2")).toHaveLength(2);
	});

	it("handles extra whitespace around sets", () => {
		expect(parseSets("  6-4  ,  6-2  ")).toHaveLength(2);
	});

	it("parses a tiebreak set (7-6)", () => {
		const sets = parseSets("7-6, 6-4");
		expect(sets[0]).toEqual({ a: 7, b: 6, isTiebreak: false });
	});
});

describe("getWinner", () => {
	it("returns 'a' when player A wins more sets", () => {
		expect(getWinner([
			{ a: 6, b: 4, isTiebreak: false },
			{ a: 6, b: 2, isTiebreak: false },
		])).toBe("a");
	});

	it("returns 'b' when player B wins more sets", () => {
		expect(getWinner([
			{ a: 4, b: 6, isTiebreak: false },
			{ a: 2, b: 6, isTiebreak: false },
		])).toBe("b");
	});

	it("returns 'a' for a three-set comeback win by A", () => {
		expect(getWinner([
			{ a: 3, b: 6, isTiebreak: false },
			{ a: 6, b: 4, isTiebreak: false },
			{ a: 10, b: 7, isTiebreak: true },
		])).toBe("a");
	});

	it("returns 'b' for a three-set win by B", () => {
		expect(getWinner([
			{ a: 6, b: 3, isTiebreak: false },
			{ a: 4, b: 6, isTiebreak: false },
			{ a: 5, b: 7, isTiebreak: false },
		])).toBe("b");
	});

	it("returns null for an equal number of sets (invalid match state)", () => {
		expect(getWinner([
			{ a: 6, b: 4, isTiebreak: false },
			{ a: 4, b: 6, isTiebreak: false },
		])).toBeNull();
	});

	it("returns null for an empty sets array", () => {
		expect(getWinner([])).toBeNull();
	});
});

describe("determineWinner", () => {
	it("returns playerA id when A wins", () => {
		expect(determineWinner(1, 2, "6-4, 6-2")).toBe(1);
	});

	it("returns playerB id when B wins", () => {
		expect(determineWinner(1, 2, "4-6, 2-6")).toBe(2);
	});

	it("returns playerA id when winner cannot be determined (defaults to A)", () => {
		// getWinner returns null → defaults to playerA
		expect(determineWinner(10, 20, "")).toBe(10);
	});

	it("works with a super-tiebreak match", () => {
		// B wins set 1, A wins set 2 and tiebreak → A wins
		expect(determineWinner(5, 6, "4-6, 6-3, [10-7]")).toBe(5);
	});
});

describe("countSets", () => {
	it("counts sets correctly for a straight-sets win", () => {
		expect(countSets("6-4, 6-2")).toEqual({ aSets: 2, bSets: 0 });
	});

	it("counts sets correctly for a three-set match", () => {
		expect(countSets("6-4, 3-6, 7-5")).toEqual({ aSets: 2, bSets: 1 });
	});

	it("counts a super-tiebreak win for A", () => {
		// A wins set 1, B wins set 2, A wins tiebreak
		expect(countSets("6-3, 3-6, [10-7]")).toEqual({ aSets: 2, bSets: 1 });
	});

	it("counts a super-tiebreak win for B", () => {
		expect(countSets("3-6, 6-3, [7-10]")).toEqual({ aSets: 1, bSets: 2 });
	});

	it("returns zeros for empty string", () => {
		expect(countSets("")).toEqual({ aSets: 0, bSets: 0 });
	});
});
