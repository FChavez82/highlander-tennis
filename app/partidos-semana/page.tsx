/**
 * /partidos-semana — Public weekly match assignments.
 * Shows published schedule weeks with their match pairings so all players
 * can see who they're playing this week and next.
 */
import { getScheduleWeeks, getMatchesByWeek, getWeekAvailability } from "@/lib/db";
import type { ScheduleWeek, Match, PlayerAvailability } from "@/lib/db";
import { WEEK_STATUS_PUBLISHED, WEEK_STATUS_COMPLETED, REVALIDATE_SECONDS } from "@/lib/constants";
import WeeklyMatchesView from "./WeeklyMatchesView";

/** Revalidate every 60 seconds — players see cached data, DB hit at most once/min */
export const revalidate = REVALIDATE_SECONDS;

/** Week data bundled with matches and availability for the view */
export interface PublicWeekData extends ScheduleWeek {
	matches: Match[];
	availability: PlayerAvailability[];
}

export default async function PartidosSemanaPage() {
	/* Only show published and completed weeks */
	const allWeeks = await getScheduleWeeks();
	const visibleWeeks = allWeeks.filter(
		(w) => w.status === WEEK_STATUS_PUBLISHED || w.status === WEEK_STATUS_COMPLETED
	);

	/* Fetch matches and availability for each visible week */
	const weeksWithData: PublicWeekData[] = await Promise.all(
		visibleWeeks.map(async (week) => {
			const [matches, availability] = await Promise.all([
				getMatchesByWeek(week.id),
				getWeekAvailability(week.id),
			]);
			return { ...week, matches, availability };
		})
	);

	return <WeeklyMatchesView weeks={weeksWithData} />;
}
