import { describe, it, expect, vi, afterEach } from "vitest";
import { safeDate, isRecent } from "../utils";
import { RECENT_MATCH_DAYS } from "../constants";

describe("safeDate", () => {
	it("parses a date string and pins to noon", () => {
		const d = safeDate("2024-06-15");
		expect(d.getHours()).toBe(12);
		expect(d.getFullYear()).toBe(2024);
		expect(d.getMonth()).toBe(5); // June is 0-indexed 5
		expect(d.getDate()).toBe(15);
	});

	it("accepts a Date object", () => {
		const input = new Date("2024-06-15T20:00:00Z");
		const d = safeDate(input);
		expect(d.getHours()).toBe(12);
		expect(d.getFullYear()).toBe(2024);
	});

	it("strips time component from datetime strings", () => {
		const d = safeDate("2024-01-01T23:59:59");
		expect(d.getHours()).toBe(12);
		expect(d.getDate()).toBe(1);
	});
});

describe("isRecent", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns false for null", () => {
		expect(isRecent(null)).toBe(false);
	});

	it("returns true for today's date", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00"));
		expect(isRecent("2024-06-15")).toBe(true);
	});

	it("returns true for a match within the threshold", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00"));
		const withinThreshold = new Date("2024-06-15");
		withinThreshold.setDate(withinThreshold.getDate() - (RECENT_MATCH_DAYS - 1));
		expect(isRecent(withinThreshold.toISOString().slice(0, 10))).toBe(true);
	});

	it("returns false for a match older than the threshold", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00"));
		const old = new Date("2024-06-15");
		old.setDate(old.getDate() - (RECENT_MATCH_DAYS + 1));
		expect(isRecent(old.toISOString().slice(0, 10))).toBe(false);
	});

	it("returns false for a future date", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00"));
		expect(isRecent("2024-06-20")).toBe(false);
	});

	it("accepts a Date object", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00"));
		expect(isRecent(new Date("2024-06-14"))).toBe(true);
	});
});
