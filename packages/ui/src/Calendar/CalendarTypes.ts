export const CalendarContextName: unique symbol = Symbol.for("torp.Calendar");

export interface CalendarContext {
	selectable: boolean;
	startOfWeek: number;
	// The registerDay function is called from each CalendarDay to register itself with this
	// Calendar. They pass us a setActive method that we can call
	registerDay: (date: Date, setActive: (value: boolean) => void) => void;
	handleTrigger: (type: TriggerType) => void;
	handleDay: (date: Date) => void;
	handleKey: (e: KeyboardEvent) => void;
	state: CalendarState;
}

export interface CalendarState {
	activeDate: Date;
	visibleDate: Date;
	visibleStartDate: Date;
	visibleEndDate: Date;
	days: DayState[];
}

export interface DayState {
	date: Date;
	muted: boolean;
	active: boolean;
	setActive?: (value: boolean) => void;
}

export interface CalendarEvent {
	date: Date;
	content: string;
	color: string;
}

export type TriggerType = "previous" | "next";
