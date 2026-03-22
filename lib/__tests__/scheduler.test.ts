/**
 * Tests for the scheduler algorithm in lib/scheduler.ts.
 *
 * The scheduler depends on @vercel/postgres (sql tagged template), so we mock
 * the module to return controlled data. This lets us test the pure algorithm
 * logic (pairing, bye assignment, duplicate prevention) without a database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ScheduleInput } from "../scheduler";

/* ── Mock @vercel/postgres before importing the module under test ── */
vi.mock("@vercel/postgres", () => ({
	sql: vi.fn(),
}));

/* Imported AFTER the mock is registered */
import { generateWeekPairings, getExistingMatchups } from "../scheduler";
import { sql } from "@vercel/postgres";

const sqlMock = sql as unknown as ReturnType<typeof vi.fn>;

/* Helper to configure the mock to return specific rows */
function mockSql(existingMatchRows: Array<{ player_a_id: number; player_b_id: number }>, byeRows: Array<{ player_id: number; bye_count: number }> = []) {
	let callCount = 0;
	sqlMock.mockImplementation((..._args: unknown[]) => {
		callCount++;
		if (callCount === 1) {
			/* First call: getExistingMatchups */
			return Promise.resolve({ rows: existingMatchRows });
		}
		/* Second call: getByeHistory */
		return Promise.resolve({ rows: byeRows });
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

/* ================================================================
   generateWeekPairings — basic pairing
   ================================================================ */

describe("generateWeekPairings — basic pairing", () => {
	it("returns no pairings and bye=null for 0 players", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [] };
		const result = await generateWeekPairings(input);
		expect(result.pairings).toEqual([]);
		expect(result.bye).toBeNull();
		expect(result.unpairedIds).toEqual([]);
	});

	it("returns no pairings and bye=playerId for 1 player", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [5] };
		const result = await generateWeekPairings(input);
		expect(result.pairings).toEqual([]);
		expect(result.bye).toBe(5);
	});

	it("pairs 2 players correctly", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2] };
		const result = await generateWeekPairings(input);
		expect(result.pairings).toHaveLength(1);
		expect(result.bye).toBeNull();
		expect(result.unpairedIds).toEqual([]);
		const [pair] = result.pairings;
		expect(new Set([pair.playerAId, pair.playerBId])).toEqual(new Set([1, 2]));
	});

	it("pairs 4 players into 2 matches", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3, 4] };
		const result = await generateWeekPairings(input);
		expect(result.pairings).toHaveLength(2);
		expect(result.bye).toBeNull();
		expect(result.unpairedIds).toEqual([]);

		/* Each player appears exactly once */
		const allIds = result.pairings.flatMap((p) => [p.playerAId, p.playerBId]);
		expect(new Set(allIds).size).toBe(4);
	});

	it("always puts the lower ID as playerA", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [3, 1] };
		const result = await generateWeekPairings(input);
		expect(result.pairings[0].playerAId).toBeLessThan(result.pairings[0].playerBId);
	});
});

/* ================================================================
   generateWeekPairings — odd player count / byes
   ================================================================ */

describe("generateWeekPairings — bye assignment", () => {
	it("assigns a bye when there is an odd number of players", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3] };
		const result = await generateWeekPairings(input);
		expect(result.bye).not.toBeNull();
		expect(result.pairings).toHaveLength(1);
	});

	it("bye player is not included in any pairing", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3] };
		const result = await generateWeekPairings(input);
		const pairedIds = new Set(result.pairings.flatMap((p) => [p.playerAId, p.playerBId]));
		expect(pairedIds.has(result.bye!)).toBe(false);
	});

	it("gives the bye to the player with fewest past byes", async () => {
		/* Player 2 has already had 3 byes, player 3 has had 1 bye, player 1 has had 0 byes.
		   Player 1 should get the bye this round (fewest). */
		const byeRows = [
			{ player_id: 2, bye_count: 3 },
			{ player_id: 3, bye_count: 1 },
			/* player 1 absent → 0 byes */
		];
		mockSql([], byeRows);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3] };
		const result = await generateWeekPairings(input);
		expect(result.bye).toBe(1);
	});

	it("breaks bye ties by player ID (lowest wins)", async () => {
		/* All 3 players have the same bye count — player 1 (lower ID) should get the bye */
		const byeRows = [
			{ player_id: 1, bye_count: 2 },
			{ player_id: 2, bye_count: 2 },
			{ player_id: 3, bye_count: 2 },
		];
		mockSql([], byeRows);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3] };
		const result = await generateWeekPairings(input);
		expect(result.bye).toBe(1);
	});
});

/* ================================================================
   generateWeekPairings — duplicate prevention
   ================================================================ */

describe("generateWeekPairings — duplicate prevention", () => {
	it("skips already-played matchups", async () => {
		/* Players 1 and 2 have already played — only valid pair is 1v3 and 2 goes unpaired */
		mockSql([{ player_a_id: 1, player_b_id: 2 }]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3] };
		const result = await generateWeekPairings(input);

		/* 3 players: one gets bye, one new match should be formed (1v3 or 2v3), the other unpaired or paired */
		const allPairedIds = new Set(result.pairings.flatMap((p) => [p.playerAId, p.playerBId]));
		/* Ensure 1-2 pair does not appear */
		for (const p of result.pairings) {
			const ids = new Set([p.playerAId, p.playerBId]);
			expect(ids.has(1) && ids.has(2)).toBe(false);
		}
	});

	it("all valid pairings are distinct (no duplicate matchup keys)", async () => {
		mockSql([]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2, 3, 4, 5, 6] };
		const result = await generateWeekPairings(input);

		const keys = result.pairings.map(
			(p) => `${Math.min(p.playerAId, p.playerBId)}-${Math.max(p.playerAId, p.playerBId)}`
		);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("puts all players in unpairedIds when every possible matchup is exhausted", async () => {
		/* 2 players who have already played each other — neither can be paired */
		mockSql([{ player_a_id: 1, player_b_id: 2 }]);
		const input: ScheduleInput = { weekId: 1, category: "M", availablePlayerIds: [1, 2] };
		const result = await generateWeekPairings(input);
		expect(result.pairings).toHaveLength(0);
		expect(result.unpairedIds).toEqual(expect.arrayContaining([1, 2]));
	});
});

/* ================================================================
   getExistingMatchups
   ================================================================ */

describe("getExistingMatchups", () => {
	it("returns a Set of canonical matchup keys", async () => {
		sqlMock.mockResolvedValueOnce({
			rows: [
				{ player_a_id: 3, player_b_id: 7 },
				{ player_a_id: 7, player_b_id: 3 }, /* duplicate — should be same key */
				{ player_a_id: 1, player_b_id: 5 },
			],
		});
		const set = await getExistingMatchups("M");
		/* Canonical form: min-max */
		expect(set.has("3-7")).toBe(true);
		expect(set.has("1-5")).toBe(true);
		/* Both row orderings of 3-7 produce the same key */
		expect(set.size).toBe(2);
	});

	it("returns an empty Set when there are no matches", async () => {
		sqlMock.mockResolvedValueOnce({ rows: [] });
		const set = await getExistingMatchups("F");
		expect(set.size).toBe(0);
	});
});
