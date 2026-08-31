import { areDatesEqual } from "../utils/dateUtils";
import { type CalendarState, type DayState } from "./CalendarTypes";

// The dates created here are plain dates -- they get wrapped automatically
// when they're assigned to watched state
export default function buildDays($state: CalendarState, startOfWeek: number): DayState[] {
	const newDays = [];

	const date = $state.visibleDate;
	const activeDate = $state.activeDate;

	// Set the first day to the start of the week before the first day of
	// the month (e.g. Monday the 28th of the previous month)
	let visibleStartDate = new Date();
	visibleStartDate.setFullYear(date.getFullYear(), date.getMonth(), 1);
	visibleStartDate.setDate(
		visibleStartDate.getDate() - ((visibleStartDate.getDay() + 7 - startOfWeek) % 7),
	);

	// Set the last day to the end of the week after the last day of the
	// month (e.g. Sunday the 6th of the next month)
	let visibleEndDate = new Date();
	visibleEndDate.setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
	visibleEndDate.setDate(
		visibleEndDate.getDate() + ((startOfWeek - 1 - visibleEndDate.getDay() + 7) % 7),
	);

	$state.visibleStartDate = visibleStartDate;
	$state.visibleEndDate = visibleEndDate;

	const dayDiff =
		Math.round((visibleEndDate.getTime() - visibleStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	for (let i = 0; i < dayDiff; i++) {
		const dayDate = new Date();
		dayDate.setFullYear(
			visibleStartDate.getFullYear(),
			visibleStartDate.getMonth(),
			visibleStartDate.getDate() + i,
		);
		dayDate.setHours(0);
		dayDate.setMinutes(0);
		dayDate.setSeconds(0);
		dayDate.setMilliseconds(0);
		const newDay: DayState = {
			date: dayDate,
			muted: dayDate.getMonth() !== date.getMonth(),
			active: areDatesEqual(dayDate, activeDate),
		};
		newDays.push(newDay);
	}

	return newDays;
}
