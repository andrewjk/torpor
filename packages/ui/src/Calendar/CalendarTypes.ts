import { ReactiveDate } from "@torpor/view";

export const CalendarContextName: unique symbol = Symbol.for("torp.Calendar");

export interface CalendarContext {
	selectable: boolean;
	startOfWeek: number;
	// The registerDay function is called from each CalendarDay to register itself with this
	// Calendar. They pass us a setActive method that we can call
	registerDay: (date: ReactiveDate, setActive: (value: boolean) => void) => void;
	handleTrigger: (type: TriggerType) => void;
	handleDay: (date: ReactiveDate) => void;
	handleKey: (e: KeyboardEvent) => void;
	state: CalendarState;
}

export interface CalendarState {
	activeDate: ReactiveDate;
	visibleDate: ReactiveDate;
	visibleStartDate: ReactiveDate;
	visibleEndDate: ReactiveDate;
	days: DayState[];
}

export interface DayState {
	date: Date;
	muted: boolean;
	state: {
		active: boolean;
	};
	setActive?: (value: boolean) => void;
}

export interface CalendarEvent {
	date: Date;
	content: string;
	color: string;
}

export type TriggerType = "previous" | "next";
