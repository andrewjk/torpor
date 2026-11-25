import type ServerEvent from "../server/ServerEvent";

/**
 * The base path of the site handling a request.
 *
 * Unlike the client runtime (one site per page), a server process can host
 * several sites with different base paths (tests, multi-tenant servers), so
 * the server must not read the module-global `getBasePath()`. The site's
 * `createServerLoad` handler tags each event with its base here, and response
 * finalization (`ServerEvent.addHeaders`) reads it back.
 *
 * Keyed weakly by the event, so no cleanup is needed when a request ends.
 */
const bases = new WeakMap<ServerEvent, string>();

/** Records the base path of the site handling `ev`. */
export function setRequestBase(ev: ServerEvent, base: string): void {
	bases.set(ev, base);
}

/** The base path of the site handling `ev` ("" when unset). */
export function requestBase(ev: ServerEvent): string {
	return bases.get(ev) ?? "";
}
