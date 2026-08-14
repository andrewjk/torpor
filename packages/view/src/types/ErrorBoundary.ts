import type Computed from "./Computed";
import type Effect from "./Effect";
import type ProxySignal from "./ProxySignal";

/**
 * An error boundary created by `t_run_try` (`@try`/`@catch` groups and
 * top-level `@error` blocks). Stored on the boundary's `Region` so that
 * `routeEffectError` can find the nearest enclosing boundary by walking the
 * region chain from a failing effect's owning region.
 */
export default interface ErrorBoundary {
	/**
	 * The error to render in the catch branch: set either by a synchronous
	 * build throw (handled internally by `runTry`) or by an effect error
	 * routed from `triggerEffects`.
	 */
	error: any;

	/**
	 * True when an effect error has been routed here and the boundary's
	 * effect needs to (re-)render the catch branch with `error`.
	 */
	hasError: boolean;

	/**
	 * The boundary's control effect. Re-run by `routeEffectError` to render
	 * the catch branch for a routed error.
	 */
	effect: Effect | null;

	/**
	 * Source signals held while the catch branch is showing, so the boundary
	 * re-runs (and re-attempts the try branch) when they change. Captured
	 * from the routed erroring effect's subscriptions — reads wrapped in
	 * nested `$run` effects (text/attribute interpolation) are tracked by
	 * those effects, not the boundary, so without holding them the catch
	 * branch would never recover.
	 */
	heldSignals: (ProxySignal | Computed)[] | null;
}
