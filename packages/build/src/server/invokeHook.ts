import type ServerHook from "../types/ServerHook";
import type ServerLoadEvent from "../types/ServerLoadEvent";

/**
 * Invokes a server hook's `enter` function and returns its `Response`, so
 * in-process callers can short-circuit when the hook returns one (a redirect
 * for unauthenticated users, etc).
 *
 * This exists because a hook declared with
 * `export default { ... } satisfies ServerHook<"/api">` keeps the
 * implementation's inferred return type -- usually `void` -- so calling
 * `hook.enter(event)` directly doesn't type the result as `Response | void`.
 */
export default async function invokeHook<Route extends string | undefined = undefined>(
	hook: ServerHook<Route>,
	event: ServerLoadEvent<Route>,
): Promise<Response | undefined> {
	return (await hook.enter?.(event)) ?? undefined;
}
