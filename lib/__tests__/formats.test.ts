import { describe, it, expect } from "vitest";
import {
	shufflePlayers,
	generateRoundRobinPairings,
	roundRobinMatchCount,
	splitIntoGroups,
	groupLabel,
	generateSwissRound1,
	createRng,
	generateTennisScore,
	simulateRoundRobin,
	simulateSwiss,
	SWISS_ROUNDS,
} from "../formats";
import type { Standing } from "../formats";

/* ── Test fixtures ──────────────────────────────────────────────────────── */

function makePlayer(id: number, name = `Player${id}`): Standing {
	return { id, name, category: "M", played: 0, won: 0, lost: 0, pending: 0, sets_won: 0, sets_lost: 0 };
}

const PLAYERS_4 = [1, 2, 3, 4].map((id) => makePlayer(id));
const PLAYERS_6 = [1, 2, 3, 4, 5, 6].map((id) => makePlayer(id));
const PLAYERS_8 = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => makePlayer(id));
const PLAYERS_5 = [1, 2, 3, 4, 5].map((id) => makePlayer(id));

/* ── shufflePlayers ─────────────────────────────────────────────────────── */

describe("shufflePlayers", () => {
	it("returns the same length as input", () => {
		expect(shufflePlayers(PLAYERS_4, 42)).toHaveLength(4);
	});

	it("returns all original elements", () => {
		const shuffled = shufflePlayers(PLAYERS_4, 42);
		const ids = shuffled.map((p) => p.id).sort();
		expect(ids).toEqual([1, 2, 3, 4]);
	});

	it("is deterministic for the same seed", () => {
		const a = shufflePlayers(PLAYERS_6, 99);
		const b = shufflePlayers(PLAYERS_6, 99);
		expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
	});

	it("produces different orderings for different seeds", () => {
		// With 6 players and two different seeds this should almost always differ
		const a = shufflePlayers(PLAYERS_6, 1);
		const b = shufflePlayers(PLAYERS_6, 2);
		expect(a.map((p) => p.id)).not.toEqual(b.map((p) => p.id));
	});

	it("does not mutate the original array", () => {
		const original = [...PLAYERS_4];
		shufflePlayers(PLAYERS_4, 42);
		expect(PLAYERS_4).toEqual(original);
	});

	it("handles a single-element array", () => {
		const single = [makePlayer(1)];
		expect(shufflePlayers(single, 1)).toHaveLength(1);
	});

	it("handles an empty array", () => {
		expect(shufflePlayers([], 1)).toEqual([]);
	});
});

/* ── generateRoundRobinPairings ─────────────────────────────────────────── */

describe("generateRoundRobinPairings", () => {
	it("generates N*(N-1)/2 pairs for 4 players", () => {
		const pairs = generateRoundRobinPairings(PLAYERS_4);
		expect(pairs).toHaveLength(6);
	});

	it("generates N*(N-1)/2 pairs for 6 players", () => {
		const pairs = generateRoundRobinPairings(PLAYERS_6);
		expect(pairs).toHaveLength(15);
	});

	it("each pair is unique (no duplicates or self-matches)", () => {
		const pairs = generateRoundRobinPairings(PLAYERS_6);
		const seen = new Set<string>();
		for (const [a, b] of pairs) {
			expect(a.id).not.toBe(b.id);
			const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
			expect(seen.has(key)).toBe(false);
			seen.add(key);
		}
	});

	it("returns empty for 0 players", () => {
		expect(generateRoundRobinPairings([])).toEqual([]);
	});

	it("returns empty for 1 player", () => {
		expect(generateRoundRobinPairings([makePlayer(1)])).toEqual([]);
	});
});

/* ── roundRobinMatchCount ───────────────────────────────────────────────── */

describe("roundRobinMatchCount", () => {
	it("returns 0 for 1 player", () => {
		expect(roundRobinMatchCount(1)).toBe(0);
	});

	it("returns 1 for 2 players", () => {
		expect(roundRobinMatchCount(2)).toBe(1);
	});

	it("returns 6 for 4 players", () => {
		expect(roundRobinMatchCount(4)).toBe(6);
	});

	it("returns 15 for 6 players", () => {
		expect(roundRobinMatchCount(6)).toBe(15);
	});

	it("matches the actual number of pairs generated", () => {
		const pairs = generateRoundRobinPairings(PLAYERS_8);
		expect(pairs).toHaveLength(roundRobinMatchCount(8));
	});
});

/* ── splitIntoGroups ────────────────────────────────────────────────────── */

describe("splitIntoGroups", () => {
	it("splits 8 players into 2 equal groups", () => {
		const groups = splitIntoGroups(PLAYERS_8, 2);
		expect(groups).toHaveLength(2);
		expect(groups[0]).toHaveLength(4);
		expect(groups[1]).toHaveLength(4);
	});

	it("distributes remainder across early groups (6 into 4 groups)", () => {
		const players = [1, 2, 3, 4, 5, 6].map(makePlayer);
		const groups = splitIntoGroups(players, 4);
		// 6 players, 4 groups → [2,2,1,1]
		expect(groups.flat()).toHaveLength(6);
		expect(groups[0].length).toBeGreaterThanOrEqual(groups[3].length);
	});

	it("preserves all players", () => {
		const groups = splitIntoGroups(PLAYERS_8, 4);
		expect(groups.flat().map((p) => p.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});
});

/* ── groupLabel ─────────────────────────────────────────────────────────── */

describe("groupLabel", () => {
	it("returns 'A' for index 0", () => {
		expect(groupLabel(0)).toBe("A");
	});

	it("returns 'B' for index 1", () => {
		expect(groupLabel(1)).toBe("B");
	});

	it("returns 'D' for index 3", () => {
		expect(groupLabel(3)).toBe("D");
	});
});

/* ── generateSwissRound1 ────────────────────────────────────────────────── */

describe("generateSwissRound1", () => {
	it("returns N/2 pairs for an even number of players", () => {
		const { pairs, bye } = generateSwissRound1(PLAYERS_6, 42);
		expect(pairs).toHaveLength(3);
		expect(bye).toBeNull();
	});

	it("returns (N-1)/2 pairs and one bye for an odd number of players", () => {
		const { pairs, bye } = generateSwissRound1(PLAYERS_5, 42);
		expect(pairs).toHaveLength(2);
		expect(bye).not.toBeNull();
	});

	it("the bye player is not in any pair", () => {
		const { pairs, bye } = generateSwissRound1(PLAYERS_5, 42);
		const pairedIds = new Set(pairs.flatMap(([a, b]) => [a.id, b.id]));
		expect(pairedIds.has(bye!.id)).toBe(false);
	});

	it("all players are accounted for", () => {
		const { pairs, bye } = generateSwissRound1(PLAYERS_5, 42);
		const all = new Set([...pairs.flatMap(([a, b]) => [a.id, b.id]), bye!.id]);
		expect(all.size).toBe(5);
	});

	it("is deterministic for the same seed", () => {
		const a = generateSwissRound1(PLAYERS_6, 7);
		const b = generateSwissRound1(PLAYERS_6, 7);
		expect(a.pairs.map(([x, y]) => [x.id, y.id])).toEqual(b.pairs.map(([x, y]) => [x.id, y.id]));
	});
});

/* ── createRng ──────────────────────────────────────────────────────────── */

describe("createRng", () => {
	it("returns values in [0, 1)", () => {
		const rng = createRng(42);
		for (let i = 0; i < 100; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it("is deterministic for the same seed", () => {
		const rng1 = createRng(123);
		const rng2 = createRng(123);
		for (let i = 0; i < 10; i++) {
			expect(rng1()).toBe(rng2());
		}
	});
});

/* ── generateTennisScore ────────────────────────────────────────────────── */

describe("generateTennisScore", () => {
	it("returns a score string and a boolean winner flag", () => {
		const rng = createRng(1);
		const { score, winnerIsA } = generateTennisScore(rng);
		expect(typeof score).toBe("string");
		expect(typeof winnerIsA).toBe("boolean");
	});

	it("score has 2 or 3 sets", () => {
		const rng = createRng(1);
		for (let i = 0; i < 50; i++) {
			const { score } = generateTennisScore(rng);
			const sets = score.split(", ");
			expect(sets.length).toBeGreaterThanOrEqual(2);
			expect(sets.length).toBeLessThanOrEqual(3);
		}
	});

	it("super-tiebreak third set has winner scoring 10", () => {
		// Generate many scores until we get a super-tiebreak
		const rng = createRng(5);
		let foundSuperTb = false;
		for (let i = 0; i < 200; i++) {
			const { score } = generateTennisScore(rng);
			if (score.includes("[")) {
				const tb = score.match(/\[(\d+)-(\d+)\]/);
				expect(tb).not.toBeNull();
				// One side should be 10
				const [, a, b] = tb!.map(Number);
				expect(Math.max(a, b)).toBe(10);
				foundSuperTb = true;
				break;
			}
		}
		expect(foundSuperTb).toBe(true);
	});
});

/* ── simulateRoundRobin ─────────────────────────────────────────────────── */

describe("simulateRoundRobin", () => {
	it("produces the correct number of match results", () => {
		const { results } = simulateRoundRobin(PLAYERS_4, 42);
		expect(results.size).toBe(roundRobinMatchCount(4)); // 6
	});

	it("returns standings with all players", () => {
		const { standings } = simulateRoundRobin(PLAYERS_4, 42);
		expect(standings).toHaveLength(4);
	});

	it("standings total wins + losses = N-1 per player", () => {
		const { standings } = simulateRoundRobin(PLAYERS_6, 42);
		for (const rec of standings) {
			expect(rec.wins + rec.losses).toBe(5); // plays 5 matches in a 6-player RR
		}
	});

	it("is deterministic for the same seed", () => {
		const a = simulateRoundRobin(PLAYERS_4, 100);
		const b = simulateRoundRobin(PLAYERS_4, 100);
		expect(a.standings.map((r) => r.player.id)).toEqual(b.standings.map((r) => r.player.id));
	});

	it("produces different standings for different seeds", () => {
		const a = simulateRoundRobin(PLAYERS_6, 1);
		const b = simulateRoundRobin(PLAYERS_6, 9999);
		// Different seeds should (in practice) produce different top-player rankings
		// This could theoretically be equal but is extremely unlikely with 6 players
		const aOrder = a.standings.map((r) => r.player.id).join();
		const bOrder = b.standings.map((r) => r.player.id).join();
		expect(aOrder).not.toBe(bOrder);
	});
});

/* ── simulateSwiss ──────────────────────────────────────────────────────── */

describe("simulateSwiss", () => {
	it("produces exactly SWISS_ROUNDS rounds", () => {
		const rounds = simulateSwiss(PLAYERS_8, 42);
		expect(rounds).toHaveLength(SWISS_ROUNDS);
	});

	it("each round has match results", () => {
		const rounds = simulateSwiss(PLAYERS_8, 42);
		for (const round of rounds) {
			expect(round.matches.length).toBeGreaterThan(0);
		}
	});

	it("total matches + bye per round equals number of players", () => {
		const rounds = simulateSwiss(PLAYERS_8, 42); // 8 players — even, no byes
		for (const round of rounds) {
			expect(round.matches.length * 2 + (round.bye ? 1 : 0)).toBe(8);
		}
	});

	it("no player appears twice in the same round", () => {
		const rounds = simulateSwiss(PLAYERS_8, 42);
		for (const round of rounds) {
			const seenIds = new Set<number>();
			for (const match of round.matches) {
				expect(seenIds.has(match.playerA.id)).toBe(false);
				expect(seenIds.has(match.playerB.id)).toBe(false);
				seenIds.add(match.playerA.id);
				seenIds.add(match.playerB.id);
			}
		}
	});

	it("standings in final round contain all players", () => {
		const rounds = simulateSwiss(PLAYERS_8, 42);
		const finalStandings = rounds[rounds.length - 1].standings;
		expect(finalStandings).toHaveLength(8);
	});

	it("is deterministic for the same seed", () => {
		const a = simulateSwiss(PLAYERS_6, 77);
		const b = simulateSwiss(PLAYERS_6, 77);
		const aFinal = a[a.length - 1].standings.map((r) => r.player.id);
		const bFinal = b[b.length - 1].standings.map((r) => r.player.id);
		expect(aFinal).toEqual(bFinal);
	});
});
