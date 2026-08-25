export const StepperContextName: unique symbol = Symbol.for("torp.Stepper");

export interface StepperStepState {
	/** The index of the step */
	index: number;
}

export interface StepperContext {
	/** Called from a step when it is added */
	registerStep: () => StepperStepState;
	/** Called from a step when it is removed */
	removeStep: (index: number) => void;
	/** The index of the current step */
	getValue: () => number;
	/** Moves to the step at the given index */
	setValue: (index: number) => void;
	/** Moves to the next step, or raises oncomplete on the last one */
	next: () => void;
	/** Moves to the previous step */
	previous: () => void;
	/** Whether the next / previous controls can move from the current step */
	canNext: () => boolean;
	canPrevious: () => boolean;
	/** The reactive list of registered steps */
	steps: () => StepperStepState[];
	/** The number of registered steps */
	count: () => number;
	/** Whether steps can only be visited in order, with completed ones revisitable */
	linear: boolean;
}
