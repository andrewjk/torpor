import { type Cleanup } from "./Cleanup";
import { type Subscription } from "./Subscription";

/**
 * An effect that is run and re-run when the properties it depends on change.
 */
export type Effect = {
	/**
	 * EFFECT.
	 */
	type: 2;

	/**
	 *
	 * @returns An optional cleanup function, to run when the effect is re-run or disposed.
	 */
	run: () => Cleanup | void;

	/**
	 * The optional cleanup function that may have been returned from the run function.
	 */
	cleanup: Cleanup | void;

	/**
	 * The first signal or computed that causes this effect to be run.
	 */
	firstSource: Subscription | null;

	/*
	 * The effect that is run after this one, which may be a sibling or child.
	 */
	nextEffect: Effect | null;

	/**
	 * The number of children of this effect.
	 */
	extent: number;

	/**
	 * When signals have been changed, this is the next dependent effect to run.
	 */
	nextEffectToRun: Effect | null;

	/**
	 * True if the effect encountered an exception in its last run.
	 */
	didError: boolean;

	/**
	 * The name of the effect, for debugging.
	 */
	name?: string;
};
