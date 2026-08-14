import type Effect from "./Effect";
import type ErrorBoundary from "./ErrorBoundary";

export default interface Region {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	previousRegion: Region | null;
	nextRegion: Region | null;
	depth: number;

	/**
	 * Animations that are currently running in the region, and which need to
	 * awaited or canceled before it is removed
	 */
	animations: Set<Animation> | null;

	/**
	 * The name of the region, for debugging.
	 */
	name?: string;

	/**
	 * Effects that are owned by this region.
	 */
	effects: Effect[];

	/**
	 * Set by `t_run_try` (`@try`/`@catch` groups and top-level `@error`
	 * blocks) when a catch/error branch exists. `routeEffectError` walks the
	 * region chain from a failing effect's owning region and routes the error
	 * to the nearest boundary.
	 */
	errorBoundary?: ErrorBoundary;

	/**
	 * Generation counter used by `runControl` to detect stale effects. Each
	 * `t_run_control` call increments this; effects from previous calls check
	 * it and skip execution if they're no longer current. Set ad-hoc today;
	 * declared here so the casts can be dropped.
	 */
	generation?: number;

	/**
	 * Set by `clearRegion` when a region is released but may be reused,
	 * forcing the next `t_run_branch` to re-render even at the same branch
	 * index.
	 */
	recreate?: boolean;
}
