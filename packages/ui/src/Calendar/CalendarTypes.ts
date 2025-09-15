export const CalendarContextName = "Calendar";

export interface CalendarContext {
	// The registerDay function is called from each CalendarDay to register itself with this
	// Calendar. They pass us a setActive method that we can call
	registerDay: (date: Date, setActive: (value: boolean) => void) => void;
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
