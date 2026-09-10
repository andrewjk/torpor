import env from "../env";
import CookieHelper from "./CookieHelper";

const COOKIE_NAME = "torpor-session";
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

/**
 * The data stored in the session. Must be JSON-safe, and small enough to
 * fit in a cookie (4KB) along with the id, expiry and signature.
 */
type SessionData = Record<string, unknown>;

type SessionPayload = {
	id: string;
	data: SessionData;
	/** Expiry, as a Unix epoch in milliseconds */
	exp: number;
};

// The imported signing key, cached per secret so repeated calls (per
// request) don't re-import
const keys = new Map<string, Promise<CryptoKey>>();

/**
 * A helper for reading and writing the signed session cookie, available as
 * `event.session` in load functions, actions, +server endpoints and hooks.
 *
 * The value is signed with HMAC-SHA256 using `TORPOR_SESSION_SECRET` from
 * the environment, so it can't be forged or tampered with -- but it is
 * still client-side storage: everything rides in the cookie, it can't be
 * revoked individually, and it is limited to ~4KB. When you need
 * revocation, store `session.id` in your database, check it on each
 * authed request (e.g. in a `_hook.server.ts`), and delete the row to
 * revoke.
 *
 * ```ts
 * // Login action
 * const user = await checkPassword(event.form());
 * await event.session.regenerate({ userId: user.id });
 *
 * // Root hook
 * const session = await event.session.get();
 * if (session) {
 * 	event.appData.user = await getUser(session.userId);
 * }
 * ```
 */
export default class SessionHelper {
	#cookies: CookieHelper;
	#id: string | undefined;

	constructor(cookies: CookieHelper) {
		this.#cookies = cookies;
	}

	/**
	 * The id embedded in the current session cookie, or undefined when
	 * there is no valid session. Stable across `set` calls, so it can be
	 * used as a database key; `regenerate` mints a new one.
	 */
	get id(): string | undefined {
		return this.#id;
	}

	/**
	 * Reads and verifies the session, returning its data, or undefined when
	 * there is no cookie, the signature doesn't match, or the session has
	 * expired.
	 */
	async get(): Promise<SessionData | undefined> {
		const value = this.#cookies.get(COOKIE_NAME);
		if (!value) return undefined;
		const payload = await verifyValue(value);
		if (!payload) return undefined;
		this.#id = payload.id;
		return payload.data;
	}

	/**
	 * Writes the session, signing the data and setting the cookie. Keeps
	 * the current session id, minting one when there isn't a valid session
	 * yet. Call `regenerate` instead when the session's identity should
	 * change (e.g. at login, to prevent session fixation).
	 */
	async set(data: SessionData, options?: { maxAge?: number }): Promise<void> {
		const id = this.#id ?? crypto.randomUUID();
		this.#id = id;
		await this.#write(id, data, options);
	}

	/**
	 * Writes the session with a fresh id, replacing any existing one. Use
	 * it when a session's privilege level changes (login, permission
	 * upgrade), so a cookie that was set before the change can't be reused.
	 */
	async regenerate(data: SessionData = {}, options?: { maxAge?: number }): Promise<void> {
		const id = crypto.randomUUID();
		this.#id = id;
		await this.#write(id, data, options);
	}

	/**
	 * Deletes the session cookie. Note that a server-side record (if you
	 * keep one) must be deleted or revoked separately.
	 */
	async destroy(): Promise<void> {
		this.#id = undefined;
		this.#cookies.delete(COOKIE_NAME, { path: "/" });
	}

	async #write(
		id: string,
		data: SessionData,
		options: { maxAge?: number } | undefined,
	): Promise<void> {
		const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
		const payload: SessionPayload = { id, data, exp: Date.now() + maxAge * 1000 };
		const encoded = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
		const signature = await sign(encoded);
		this.#cookies.set(COOKIE_NAME, `${encoded}.${signature}`, { path: "/", maxAge });
	}
}

function secret(): string {
	const value = env().TORPOR_SESSION_SECRET;
	if (!value) {
		throw new Error(
			"TORPOR_SESSION_SECRET is not set. Add it to the environment (or to a .env " +
				"file in dev and preview) to use sessions.",
		);
	}
	return value;
}

function signingKey(): Promise<CryptoKey> {
	const value = secret();
	let key = keys.get(value);
	if (!key) {
		key = crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(value),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign", "verify"],
		);
		keys.set(value, key);
	}
	return key;
}

async function sign(payload: string): Promise<string> {
	const signature = await crypto.subtle.sign(
		"HMAC",
		await signingKey(),
		new TextEncoder().encode(payload),
	);
	return encodeBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string): Promise<SessionPayload | undefined> {
	const dot = value.lastIndexOf(".");
	if (dot === -1) return undefined;
	const encoded = value.slice(0, dot);
	const valid = await crypto.subtle.verify(
		"HMAC",
		await signingKey(),
		decodeBase64Url(value.slice(dot + 1)),
		new TextEncoder().encode(encoded),
	);
	if (!valid) return undefined;

	let payload: SessionPayload;
	try {
		payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded)));
	} catch {
		return undefined;
	}
	if (
		typeof payload?.id !== "string" ||
		typeof payload?.exp !== "number" ||
		typeof payload?.data !== "object" ||
		payload.data === null ||
		payload.exp < Date.now()
	) {
		return undefined;
	}
	return payload;
}

function encodeBase64Url(bytes: Uint8Array): string {
	// btoa can't take raw bytes, and long argument lists overflow, so
	// convert in chunks
	let binary = "";
	for (let i = 0; i < bytes.length; i += 0x1000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x1000));
	}
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
	const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
