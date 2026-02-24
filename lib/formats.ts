/**
 * Tournament Format Utilities
 *
 * Pure client-side functions for generating tournament structures from a player list.
 * No DB writes — all logic is deterministic from the input arrays.
 *
 * Used by: /round-robin, /grupos, /suizo
 */

import type { Standing } from "@/lib/db";

/* Re-export Standing type for convenience so format pages can import from one place */
export type { Standing };

/* ================================================================
   Shuffle
   ================================================================ */

/**
 * Seeded Fisher-Yates shuffle — produces a deterministic random order
 * from the same seed so "Regenerar" produces a new draw each click
 * while remaining reproducible if the seed is stored.
 *
 * Uses a simple LCG (linear congruential generator) as the PRNG so we
 * don't need an external dependency.
 */
export function shufflePlayers<T>(players: T[], seed: number = Date.now()): T[] {
	/* Copy so we don't mutate the original */
	const arr = [...players];

	/* LCG constants (same as glibc) */
	let state = seed >>> 0;
	const next = () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0;
		return state / 0x1_0000_0000; /* [0, 1) */
	};

	/* Fisher-Yates in-place shuffle */
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(next() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
}

/* ================================================================
   Round Robin
   ================================================================ */

/**
 * Generate all unique pairings for a round-robin tournament.
 * Returns N*(N-1)/2 pairs — every player faces every other player exactly once.
 */
export function generateRoundRobinPairings(players: Standing[]): [Standing, Standing][] {
	const pairs: [Standing, Standing][] = [];

	for (let i = 0; i < players.length; i++) {
		for (let j = i + 1; j < players.length; j++) {
			pairs.push([players[i], players[j]]);
		}
	}

	return pairs;
}

/**
 * Total match count for N players in a round-robin: N*(N-1)/2
 */
export function roundRobinMatchCount(n: number): number {
	return (n * (n - 1)) / 2;
}

/* ================================================================
   Groups
   ================================================================ */

/**
 * Split players into numGroups groups as evenly as possible.
 * Extra players are distributed to the first groups (round-robin style).
 *
 * Example: 22 players into 4 groups → [6, 6, 5, 5]
 */
export function splitIntoGroups(players: Standing[], numGroups: number): Standing[][] {
	const groups: Standing[][] = Array.from({ length: numGroups }, () => []);
	players.forEach((player, index) => {
		groups[index % numGroups].push(player);
	});
	return groups;
}

/**
 * Group label: A, B, C, D, …
 */
export function groupLabel(index: number): string {
	return String.fromCharCode(65 + index); /* 65 = 'A' */
}

/* ================================================================
   Swiss System
   ================================================================ */

/**
 * Generate Round 1 random pairings for a Swiss tournament.
 * Players are shuffled then paired sequentially: [0,1], [2,3], …
 *
 * If the player count is odd, the last player gets a bye (not included in pairs).
 * Returns the paired list and optionally the bye player.
 */
export function generateSwissRound1(
	players: Standing[],
	seed: number
): { pairs: [Standing, Standing][]; bye: Standing | null } {
	const shuffled = shufflePlayers(players, seed);
	const pairs: [Standing, Standing][] = [];

	for (let i = 0; i + 1 < shuffled.length; i += 2) {
		pairs.push([shuffled[i], shuffled[i + 1]]);
	}

	/* If odd number of players, the last one gets a bye */
	const bye = shuffled.length % 2 === 1 ? shuffled[shuffled.length - 1] : null;

	return { pairs, bye };
}

/**
 * Number of rounds recommended for Swiss format based on player count.
 * Standard formula: ceil(log2(n)), min 4, max 9.
 * For this tournament we cap at 6 as specified.
 */
export const SWISS_ROUNDS = 6;

/* ================================================================
   Simulation — Shared types
   ================================================================ */

/** A single simulated match result between two players */
export interface MatchResult {
	playerA: Standing;
	playerB: Standing;
	score: string;
	winner: Standing;
}

/** Cumulative record for one player (used in standings tables) */
export interface PlayerRecord {
	player: Standing;
	wins: number;
	losses: number;
	setsWon: number;
	setsLost: number;
}

/** One group's simulation result */
export interface GroupResult {
	group: Standing[];
	matches: MatchResult[];
	standings: PlayerRecord[];
	winner: Standing;
}

/** The knockout bracket after group stage */
export interface BracketResult {
	semi1: MatchResult;
	semi2: MatchResult;
	third: MatchResult;
	final: MatchResult;
	champion: Standing;
}

/** One round in a Swiss tournament */
export interface SwissRound {
	round: number;
	matches: MatchResult[];
	bye: Standing | null;
	standings: PlayerRecord[];
}

/* ================================================================
   Simulation — RNG
   ================================================================ */

/**
 * Create a stateful LCG returning [0, 1) values.
 * Same constants as shufflePlayers so one seed controls everything.
 */
export function createRng(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0;
		return state / 0x1_0000_0000;
	};
}

/* ================================================================
   Simulation — Tennis score generator
   ================================================================ */

/**
 * Generate a realistic tennis score string.
 * - 60% straight sets (2-0)
 * - 40% three-set matches; 40% of those use super-tiebreak [10-x]
 *
 * Returns score string + which player won.
 */
export function generateTennisScore(rng: () => number): { score: string; winnerIsA: boolean } {
	/* Coin flip — who wins overall */
	const winnerIsA = rng() < 0.5;

	/**
	 * Generate one set score where the winner wins.
	 * Winner always gets 6 or 7; loser gets 0-5 (or 6 on tiebreak).
	 */
	const winSet = (): [number, number] => {
		const r = rng();
		if (r < 0.15) return [6, 0];
		if (r < 0.30) return [6, 1];
		if (r < 0.50) return [6, 2];
		if (r < 0.65) return [6, 3];
		if (r < 0.80) return [6, 4];
		/* Tiebreak set */
		return [7, 6];
	};

	/* Loser's set score when the set goes to tiebreak */
	const loseSet = (): [number, number] => {
		const [w, l] = winSet();
		return [l, w];
	};

	const isStraightSets = rng() < 0.6;

	let sets: string[];

	if (isStraightSets) {
		/* Winner takes sets 1 & 2 */
		const s1 = winSet();
		const s2 = winSet();
		sets = [`${s1[0]}-${s1[1]}`, `${s2[0]}-${s2[1]}`];
	} else {
		/* Three-set match — winner takes 2, loser takes 1 */
		const useSuper = rng() < 0.4;
		if (useSuper) {
			/* Loser wins set 1, winner wins set 2, super-tiebreak decides */
			const s1 = loseSet();
			const s2 = winSet();
			/* Super-tiebreak: winner gets 10, loser gets 0-8 */
			const loserPts = Math.floor(rng() * 9); /* 0-8 */
			sets = [`${s1[0]}-${s1[1]}`, `${s2[0]}-${s2[1]}`, `[10-${loserPts}]`];
		} else {
			/* Classic three sets */
			/* Randomly assign which set the loser wins (set 1 or set 2) */
			const loserWinsFirst = rng() < 0.5;
			if (loserWinsFirst) {
				const s1 = loseSet();
				const s2 = winSet();
				const s3 = winSet();
				sets = [`${s1[0]}-${s1[1]}`, `${s2[0]}-${s2[1]}`, `${s3[0]}-${s3[1]}`];
			} else {
				const s1 = winSet();
				const s2 = loseSet();
				const s3 = winSet();
				sets = [`${s1[0]}-${s1[1]}`, `${s2[0]}-${s2[1]}`, `${s3[0]}-${s3[1]}`];
			}
		}
	}

	return { score: sets.join(", "), winnerIsA };
}

/* ================================================================
   Simulation — Internal helpers
   ================================================================ */

/** Parse sets won/lost from a score string like "6-3, 3-6, [10-7]" */
function parseSets(score: string, winnerIsA: boolean): { aSets: number; bSets: number } {
	const parts = score.split(", ");
	let aSets = 0;
	let bSets = 0;
	for (const part of parts) {
		/* Super-tiebreak counts as a set */
		if (part.startsWith("[")) {
			if (winnerIsA) aSets++; else bSets++;
		} else {
			const [left, right] = part.split("-").map(Number);
			if (left > right) {
				/* Left side won this set — left = playerA in upper triangle */
				aSets++;
			} else {
				bSets++;
			}
		}
	}
	return { aSets, bSets };
}

/** Initialize a blank PlayerRecord */
function initRecord(player: Standing): PlayerRecord {
	return { player, wins: 0, losses: 0, setsWon: 0, setsLost: 0 };
}

/** Apply a MatchResult to two PlayerRecord entries (mutates in place) */
function applyResult(
	recA: PlayerRecord,
	recB: PlayerRecord,
	result: MatchResult
): void {
	const winnerIsA = result.winner.id === result.playerA.id;
	const { aSets, bSets } = parseSets(result.score, winnerIsA);

	if (winnerIsA) {
		recA.wins++;
		recB.losses++;
	} else {
		recB.wins++;
		recA.losses++;
	}

	recA.setsWon += aSets;
	recA.setsLost += bSets;
	recB.setsWon += bSets;
	recB.setsLost += aSets;
}

/**
 * Sort PlayerRecord[] by: wins desc → set diff desc → name asc
 */
function buildStandings(records: Map<number, PlayerRecord>): PlayerRecord[] {
	return Array.from(records.values()).sort((a, b) => {
		if (b.wins !== a.wins) return b.wins - a.wins;
		const diffA = a.setsWon - a.setsLost;
		const diffB = b.setsWon - b.setsLost;
		if (diffB !== diffA) return diffB - diffA;
		return a.player.name.localeCompare(b.player.name);
	});
}

/** Canonical key for a pair (always minId-maxId) */
function pairKey(idA: number, idB: number): string {
	return `${Math.min(idA, idB)}-${Math.max(idA, idB)}`;
}

/* ================================================================
   Simulation — Round Robin
   ================================================================ */

/**
 * Simulate a complete round-robin tournament.
 * Returns a map of match results (keyed minId-maxId) and sorted standings.
 */
export function simulateRoundRobin(
	players: Standing[],
	seed: number
): { results: Map<string, MatchResult>; standings: PlayerRecord[] } {
	const rng = createRng(seed);
	const results = new Map<string, MatchResult>();
	const records = new Map<number, PlayerRecord>(
		players.map((p) => [p.id, initRecord(p)])
	);

	/* Simulate every unique pair */
	for (let i = 0; i < players.length; i++) {
		for (let j = i + 1; j < players.length; j++) {
			const playerA = players[i];
			const playerB = players[j];
			const { score, winnerIsA } = generateTennisScore(rng);
			const winner = winnerIsA ? playerA : playerB;
			const result: MatchResult = { playerA, playerB, score, winner };

			results.set(pairKey(playerA.id, playerB.id), result);

			const recA = records.get(playerA.id)!;
			const recB = records.get(playerB.id)!;
			applyResult(recA, recB, result);
		}
	}

	return { results, standings: buildStandings(records) };
}

/* ================================================================
   Simulation — Groups
   ================================================================ */

/**
 * Simulate a full groups tournament: internal round-robins + knockout bracket.
 * The same rng drives shuffling, group matches, and bracket matches in sequence.
 */
export function simulateGroups(
	players: Standing[],
	numGroups: number,
	seed: number
): { groups: GroupResult[]; bracket: BracketResult } {
	const rng = createRng(seed);

	/* --- Shuffle players with rng (inline Fisher-Yates) --- */
	const shuffled = [...players];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	/* --- Split into groups --- */
	const rawGroups = splitIntoGroups(shuffled, numGroups);

	/* --- Simulate each group's round-robin --- */
	const groups: GroupResult[] = rawGroups.map((group) => {
		const matches: MatchResult[] = [];
		const records = new Map<number, PlayerRecord>(
			group.map((p) => [p.id, initRecord(p)])
		);

		for (let i = 0; i < group.length; i++) {
			for (let j = i + 1; j < group.length; j++) {
				const { score, winnerIsA } = generateTennisScore(rng);
				const playerA = group[i];
				const playerB = group[j];
				const winner = winnerIsA ? playerA : playerB;
				const result: MatchResult = { playerA, playerB, score, winner };
				matches.push(result);
				applyResult(records.get(playerA.id)!, records.get(playerB.id)!, result);
			}
		}

		const standings = buildStandings(records);
		return { group, matches, standings, winner: standings[0].player };
	});

	/* --- Simulate knockout bracket --- */
	const playMatch = (playerA: Standing, playerB: Standing): MatchResult => {
		const { score, winnerIsA } = generateTennisScore(rng);
		return { playerA, playerB, score, winner: winnerIsA ? playerA : playerB };
	};

	const semi1 = playMatch(groups[0].winner, groups[1].winner);
	const semi2 = playMatch(groups[2].winner, groups[3].winner);

	/* Third place: losers of semis */
	const semi1Loser = semi1.winner.id === semi1.playerA.id ? semi1.playerB : semi1.playerA;
	const semi2Loser = semi2.winner.id === semi2.playerA.id ? semi2.playerB : semi2.playerA;
	const third = playMatch(semi1Loser, semi2Loser);

	const final = playMatch(semi1.winner, semi2.winner);

	const bracket: BracketResult = {
		semi1,
		semi2,
		third,
		final,
		champion: final.winner,
	};

	return { groups, bracket };
}

/* ================================================================
   Simulation — Swiss
   ================================================================ */

/**
 * Pair players for a Swiss round.
 * Groups by wins, shuffles within group, pairs greedily skipping rematches.
 * Falls back to allowing rematches if no clean pairing exists.
 */
function swissPairPlayers(
	standings: PlayerRecord[],
	played: Set<string>,
	rng: () => number
): { pairs: [Standing, Standing][]; bye: Standing | null } {
	/* Group by win count */
	const byWins = new Map<number, Standing[]>();
	for (const rec of standings) {
		const w = rec.wins;
		if (!byWins.has(w)) byWins.set(w, []);
		byWins.get(w)!.push(rec.player);
	}

	/* Shuffle within each group */
	const pool: Standing[] = [];
	const winCounts = Array.from(byWins.keys()).sort((a, b) => b - a);
	for (const wins of winCounts) {
		const group = byWins.get(wins)!;
		for (let i = group.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[group[i], group[j]] = [group[j], group[i]];
		}
		pool.push(...group);
	}

	/* Bye: last player if odd count */
	let byePlayer: Standing | null = null;
	const available = [...pool];
	if (available.length % 2 === 1) {
		byePlayer = available.pop()!;
	}

	/* Greedy pairing — skip rematches, fall back to allowing them */
	const pairs: [Standing, Standing][] = [];
	const unpaired = [...available];

	while (unpaired.length >= 2) {
		const a = unpaired.shift()!;
		/* Find first opponent that hasn't played a yet */
		let found = false;
		for (let k = 0; k < unpaired.length; k++) {
			const b = unpaired[k];
			if (!played.has(pairKey(a.id, b.id))) {
				pairs.push([a, b]);
				unpaired.splice(k, 1);
				found = true;
				break;
			}
		}
		/* Fallback: allow rematch with next in list */
		if (!found && unpaired.length > 0) {
			const b = unpaired.shift()!;
			pairs.push([a, b]);
		}
	}

	return { pairs, bye: byePlayer };
}

/**
 * Simulate a full Swiss tournament (SWISS_ROUNDS rounds).
 * Returns each round's matches, bye, and cumulative standings.
 */
export function simulateSwiss(players: Standing[], seed: number): SwissRound[] {
	const rng = createRng(seed);
	const rounds: SwissRound[] = [];
	const records = new Map<number, PlayerRecord>(
		players.map((p) => [p.id, initRecord(p)])
	);
	const played = new Set<string>();

	for (let roundNum = 1; roundNum <= SWISS_ROUNDS; roundNum++) {
		const currentStandings = buildStandings(records);

		let pairs: [Standing, Standing][];
		let bye: Standing | null;

		if (roundNum === 1) {
			/* Round 1: Fisher-Yates shuffle then pair consecutively */
			const shuffled = [...players];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(rng() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			pairs = [];
			for (let i = 0; i + 1 < shuffled.length; i += 2) {
				pairs.push([shuffled[i], shuffled[i + 1]]);
			}
			bye = shuffled.length % 2 === 1 ? shuffled[shuffled.length - 1] : null;
		} else {
			/* Rounds 2-6: group by record, shuffle within group, pair greedily */
			({ pairs, bye } = swissPairPlayers(currentStandings, played, rng));
		}

		/* Simulate matches and record results */
		const matches: MatchResult[] = [];
		for (const [playerA, playerB] of pairs) {
			const { score, winnerIsA } = generateTennisScore(rng);
			const winner = winnerIsA ? playerA : playerB;
			const result: MatchResult = { playerA, playerB, score, winner };
			matches.push(result);
			played.add(pairKey(playerA.id, playerB.id));
			applyResult(records.get(playerA.id)!, records.get(playerB.id)!, result);
		}

		/* Bye player gets automatic win */
		if (bye) {
			records.get(bye.id)!.wins++;
		}

		rounds.push({
			round: roundNum,
			matches,
			bye,
			standings: buildStandings(records),
		});
	}

	return rounds;
}
