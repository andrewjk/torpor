import { ReactiveDate } from "@torpor/view";
import { areDatesEqual } from "../utils/dateUtils";
import { type CalendarState, type DayState } from "./CalendarTypes";

export default function buildDays($state: CalendarState, startOfWeek: number): DayState[] {
	const newDays = [];

	const date = $state.visibleDate;
	const activeDate = $state.activeDate;

	// Set the first day to the start of the week before the first day of
	// the month (e.g. Monday the 28th of the previous month)
	let visibleStartDate = new ReactiveDate();
	visibleStartDate.setFullYear(date.getFullYear(), date.getMonth(), 1);
	visibleStartDate.setDate(
		visibleStartDate.getDate() - ((visibleStartDate.getDay() + 7 - startOfWeek) % 7),
	);

	// Set the last day to the end of the week after the last day of the
	// month (e.g. Sunday the 6th of the next month)
	let visibleEndDate = new ReactiveDate();
	visibleEndDate.setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
	visibleEndDate.setDate(
		visibleEndDate.getDate() + ((startOfWeek - 1 - visibleEndDate.getDay() + 7) % 7),
	);

	$state.visibleStartDate = visibleStartDate;
	$state.visibleEndDate = visibleEndDate;

	const dayDiff =
		Math.round((visibleEndDate.getTime() - visibleStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	for (let i = 0; i < dayDiff; i++) {
		const dayDate = new ReactiveDate();
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
			state: {
				active: areDatesEqual(dayDate, activeDate),
			},
		};
		newDays.push(newDay);
	}

	return newDays;
}
