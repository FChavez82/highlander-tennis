/**
 * /admin/calendario — Manage bi-weekly match schedule.
 * Admin can generate weeks, set player availability, run the matching algorithm,
 * and publish schedules for players to see.
 */
import { unstable_noStore as noStore } from "next/cache";
import { getScheduleWeeks, getMatchesByWeek, getWeekAvailability } from "@/lib/db";
import type { ScheduleWeek, Match, PlayerAvailability } from "@/lib/db";
import AdminScheduleManager from "./AdminScheduleManager";

export const dynamic = "force-dynamic";

/** Extended week data with pre-fetched matches and availability for the admin UI */
export interface WeekWithData extends ScheduleWeek {
	matches: Match[];
	availability: PlayerAvailability[];
}

export default async function AdminCalendarioPage() {
	noStore();

	/* Fetch all schedule weeks */
	const weeks = await getScheduleWeeks();

	/* For each week, fetch its matches and availability in parallel */
	const weeksWithData: WeekWithData[] = await Promise.all(
		weeks.map(async (week) => {
			const [matches, availability] = await Promise.all([
				getMatchesByWeek(week.id),
				getWeekAvailability(week.id),
			]);
			return { ...week, matches, availability };
		})
	);

	return <AdminScheduleManager initialWeeks={weeksWithData} />;
}
