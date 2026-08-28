import ServerEvent from "../ServerEvent";

type MiddlewareFunction = {
	/**
	 * Called before the route handler. Middleware are run in the order they
	 * were added. Return a Response to short-circuit the request; the
	 * remaining middleware and the route handler are then skipped.
	 */
	enter?: (ev: ServerEvent) => Response | void | Promise<Response | void>;
	/**
	 * Called after the route handler (even if it threw), in reverse order.
	 * Return a Response to replace the response. Middleware that were skipped
	 * by a short-circuit don't get their exit hook run.
	 *
	 * If the route handler (or a later enter hook) threw, the error is
	 * available as `ev.error`; returning a Response handles the error and
	 * stops it from propagating.
	 */
	exit?: (ev: ServerEvent) => Response | void | Promise<Response | void>;
};

export default MiddlewareFunction;
