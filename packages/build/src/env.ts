import type { StandardSchemaV1 } from "./types/StandardSchema";

declare global {
	/**
	 * The server environment, as provided by the runtime: `process.env` on
	 * Node (with `.env` files loaded by the CLI in dev and preview), and the
	 * platform environment (including bindings, e.g. KV namespaces and D1
	 * databases) on Cloudflare.
	 *
	 * Declare your app's keys in an ambient `src/env.d.ts` file, e.g.
	 *
	 * ```ts
	 * /// <reference types="@torpor/build/env" />
	 * declare global {
	 * 	interface TorporEnv {
	 * 		JWT_SECRET: string;
	 * 		DB: D1Database;
	 * 	}
	 * }
	 * ```
	 *
	 * Adapter packages add their platform's keys the same way. For runtime
	 * checking, set a Standard Schema (zod, valibot, arktype, etc) on
	 * `site.env` in site.config.ts -- `env()` then validates on first use.
	 */
	interface TorporEnv {
		/**
		 * The HMAC secret used to sign session cookies -- see
		 * [Sessions](/build/sessions). Required when `event.session` is used.
		 */
		TORPOR_SESSION_SECRET?: string;
	}
}

// The env schema rides on the Site, but route code doesn't have access to
// the Site instance, so the server runtime hands it over at startup
let schema: StandardSchemaV1<unknown, TorporEnv> | undefined;

// The parsed env, cached per source object: runtime environments may hand
// each request a fresh env (e.g. Cloudflare), so a plain module-level
// cache would go stale
const cache = new WeakMap<object, TorporEnv>();

/**
 * Sets the schema used to validate (and parse) the environment. Called by
 * the server runtime with `site.env`; not for use in app code.
 */
export function setEnvSchema(value: StandardSchemaV1<unknown, TorporEnv> | undefined): void {
	schema = value;
}

/**
 * Returns the server environment: `process.env` on Node (with `.env` files
 * loaded by the CLI in dev and preview), and the platform environment (with
 * bindings, e.g. KV namespaces and D1 databases) on Cloudflare.
 *
 * ```ts
 * import env from "@torpor/build/env";
 *
 * const { JWT_SECRET } = env();
 * ```
 *
 * Server-only: call it from load functions, actions, +server endpoints and
 * hooks. The client bundle never includes it, and on the server it throws
 * when called outside a request.
 *
 * When a schema is set on `site.env`, the environment is validated on first
 * use per request -- a missing or invalid key throws immediately with the
 * schema's message, rather than passing `undefined` along. The schema must
 * validate synchronously (zod, valibot and arktype all do).
 */
export default function env(): TorporEnv {
	const source = (globalThis as { adapter?: { env?: unknown } }).adapter?.env;
	if (!source || typeof source !== "object") {
		throw new Error(
			"The environment is not available. env() can only be called in server code " +
				"(load functions, actions, +server endpoints, hooks) while a request is being handled.",
		);
	}
	if (!schema) return source as TorporEnv;

	const cached = cache.get(source);
	if (cached) return cached;

	const result = schema["~standard"].validate(source);
	if (result instanceof Promise) {
		throw new Error(
			"The site.env schema must validate synchronously (zod, valibot and arktype all do).",
		);
	}
	if (result.issues) {
		const list = result.issues.map((issue) => issue.message).join("; ");
		throw new Error(`The environment is invalid: ${list}`);
	}
	cache.set(source, result.value);
	return result.value;
}
