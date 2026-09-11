import CookieHelper from "./CookieHelper";

const COOKIE_NAME = "torpor-flash";

/**
 * A one-time values store set in a form action and shown on the next page
 * render, which survives the redirect. Available as `event.flash`; the
 * framework reads it into `$page.flash` when a page is rendered, so
 * components display it reactively:
 *
 * ```ts
 * actions: {
 * 	save: async (event) => {
 * 		// ...save...
 * 		event.flash.set("Project saved"); // { message: "Project saved" }
 * 		event.flash.set({ error: "Import failed", retryable: true });
 * 		return seeOther(`/projects/${id}`);
 * 	},
 * }
 * ```
 *
 * ```torp
 * @if ($page.flash?.message) {
 * 	<p class="flash">{$page.flash.message}</p>
 * }
 * ```
 *
 * The values ride in a (session-lifetime) cookie that is deleted when it is
 * read, so a page refresh shows them once. No signing: the only person who
 * can fake a flash is the one seeing it, and values are rendered as text.
 * They must be JSON-safe and small enough to fit in the cookie (~4KB). A
 * common shape for a styled banner is `{ type, message }`, for use e.g.
 * with the Notification component -- but the framework only requires the
 * values to be an object. Without cookies the message is simply lost --
 * the action itself still completes.
 */
export default class FlashHelper {
	#cookies: CookieHelper;

	constructor(cookies: CookieHelper) {
		this.#cookies = cookies;
	}

	/**
	 * Reads the flash values, if any, and clears them: the same response
	 * deletes the cookie, so the message shows exactly once. (When the
	 * message was set during this same request, e.g. a form action that
	 * re-renders instead of redirecting, the cookie is consumed without it
	 * ever reaching the browser.)
	 */
	get(): Record<string, unknown> | undefined {
		const cookie = this.#cookies.get(COOKIE_NAME);
		if (!cookie) return undefined;
		this.#cookies.delete(COOKIE_NAME, { path: "/" });
		try {
			const decoded = JSON.parse(decodeURIComponent(cookie));
			if (typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) {
				return undefined;
			}
			return decoded as Record<string, unknown>;
		} catch {
			return undefined;
		}
	}

	/**
	 * Sets the flash values. A string is stored as `{ message: value }`, an
	 * object as-is, e.g. `flash.set({ error: "Import failed" })`.
	 */
	set(value: string | Record<string, unknown>): void {
		const data = typeof value === "string" ? { message: value } : value;
		this.#cookies.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(data)), { path: "/" });
	}

	/**
	 * Clears an unread flash message, e.g. so it isn't shown on a later
	 * re-render of the same page.
	 */
	clear(): void {
		this.#cookies.delete(COOKIE_NAME, { path: "/" });
	}
}
