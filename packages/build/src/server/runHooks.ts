import type ServerEvent from "./ServerEvent";

/**
 * One entry in a hook list: middleware (`MiddlewareFunction`) and server hooks
 * (`ServerHook`) are structurally identical — an optional enter and exit.
 */
interface Hook {
	enter?: (arg: any) => any;
	exit?: (arg: any) => any;
}

/**
 * A phase of hooks around a request: a hook list plus the argument its
 * enter/exit functions take (a ServerEvent for middleware, a ServerLoadEvent
 * for server hooks). Multiple phases run their enters in order; exits run in
 * the exact reverse of entry order, across phases too.
 */
export interface HookPhase {
	hooks: Hook[];
	arg: any;
}

/**
 * Runs hooks around a request handler — the shared implementation of the
 * enter/exit machine for both middleware (site.middleware, endpoint
 * middleware) and server hooks (_hook.server.ts):
 *
 * - enter hooks run in phase order, then list order, until one returns a
 *   Response (short-circuit: the handler and remaining enters are skipped)
 * - the handler runs only if no enter hook responded
 * - exit hooks run in reverse entry order — for the hooks that were entered,
 *   even when the handler or an enter hook threw
 *
 * Errors are captured (and set on `options.event.error`) rather than thrown,
 * so `options.onError` can render an error response before the exit hooks run
 * (exits inspect `ev.error` to handle it). Callers rethrow `error` when the
 * result carries no response.
 *
 * With `options.event` (the middleware flavor), `ev.response` is kept in sync
 * with the running response, and an exit hook's returned Response replaces
 * it — per the `MiddlewareFunction` contract. The server-hook flavor passes
 * no event, and its exits return void.
 */
export default async function runHooks(
	phases: HookPhase[],
	handler: () => Promise<Response | undefined>,
	options?: {
		event?: ServerEvent;
		onError?: (ev: ServerEvent, error: unknown) => Promise<Response | undefined>;
	},
): Promise<{ response: Response | undefined; error: unknown }> {
	const flat = phases.flatMap((phase) => phase.hooks.map((hook) => ({ hook, arg: phase.arg })));
	let entered = 0;
	let response: Response | undefined = undefined;
	let error: unknown = undefined;
	const ev = options?.event;
	try {
		for (; entered < flat.length && !response; entered++) {
			// A hook returns a Response to short-circuit the request
			const result = await flat[entered].hook.enter?.(flat[entered].arg);
			if (result) {
				response = result;
			}
		}
		if (!response) {
			response = await handler();
		}
	} catch (e) {
		// Exits can handle the error by returning a Response (via
		// `onError`/the caller); if none does, the caller rethrows it
		error = e;
		if (ev) {
			ev.error = e;
		}
		if (options?.onError) {
			response = await options.onError(ev!, e);
		}
	} finally {
		if (ev && response) {
			ev.response = response;
		}
		// Run exit hooks in reverse order for the hooks that were entered.
		// An exit hook can return a Response to replace the response, or to
		// handle ev.error
		while (entered > 0) {
			entered--;
			const result = await flat[entered].hook.exit?.(flat[entered].arg);
			if (result && ev) {
				response = result;
				ev.response = result;
			}
		}
	}
	return { response, error };
}
