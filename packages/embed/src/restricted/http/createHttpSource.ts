import type { RestrictedSource } from "../types";

/**
 * A host-side credential binding for the `http` source kind. Secrets live
 * here — the artifact only ever carries the credential *name*.
 */
export interface HttpCredential {
	/** Header to send the secret in. Default "Authorization". */
	header?: string;
	/** The secret value (host-side only). */
	value: string;
	/** Prefix before the value, e.g. "Bearer ". Default none. */
	prefix?: string;
}

/**
 * An operator policy for one allowed origin. Beyond allowing the origin
 * itself, it can narrow which fields of the response the artifact may see —
 * the "limit fields" half of the operator's gatekeeping, independent of
 * author intent.
 */
export interface HttpOriginPolicy {
	/** The exact origin, e.g. "https://api.corp.example". */
	origin: string;
	/**
	 * Field names the artifact may receive from this origin. Every JSON
	 * object in the response — at every nesting level — is narrowed to
	 * these fields **before** the requirement's `pick` runs, so a `pick`
	 * into a stripped path fails loudly ("pick path wasn't found") instead
	 * of surfacing `undefined`. Arrays are traversed; non-plain values are
	 * left untouched. Default: all fields.
	 */
	allowFields?: string[];
}

export interface HttpSourceOptions {
	/**
	 * Exact origins (`"https://api.example.com"`) admins may point `url` at,
	 * optionally as {@link HttpOriginPolicy} objects that also narrow the
	 * response's fields. **Default: deny all.** This is the operator's
	 * egress policy; enabling an unknown API is a deliberate deployment
	 * decision.
	 */
	allowOrigins?: Array<string | HttpOriginPolicy>;

	/**
	 * Credential name → binding. Requirements reference a name via `auth`;
	 * an unconfigured name is a render error that names the missing
	 * credential (never another credential's value).
	 */
	credentials?: Record<string, HttpCredential>;

	/** Request timeout in milliseconds. Default 5000. */
	timeout?: number;

	/** Maximum response body size in bytes. Default 1,000,000. */
	maxResponseBytes?: number;

	/**
	 * Maximum array rows kept after `pick`/`limit`. Default 1000. Applies
	 * only when the value is an array.
	 */
	maxRows?: number;

	/**
	 * Fetch implementation override — for tests, or to route through an
	 * egress proxy. Defaults to the global `fetch`.
	 */
	fetch?: typeof fetch;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_MAX_ROWS = 1000;

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Depth cap for field narrowing. JSON.parse output is a tree, so recursion
 * is bounded — but a hand-crafted response from an allowlisted origin can't
 * be trusted to be shallow, and the walk must not overflow the stack.
 */
const MAX_NARROW_DEPTH = 100;

/**
 * Creates the generic `http` source kind: one implementation serves every
 * JSON API the operator enables, so admins can point requirements at APIs
 * the host was never told about — under operator policy.
 *
 * Security posture:
 * - **Default deny**: only origins listed in `allowOrigins` are fetched.
 * - **Field narrowing**: a per-origin `allowFields` strips every
 *   non-allowlisted field from the response before the author's `pick`
 *   runs, so the operator limits what the artifact can see regardless of
 *   author intent.
 * - Literal private/loopback hosts are blocked even when allowlisted;
 *   DNS-level egress control (a proxy or `globalOutbound`) remains the
 *   deployment's job.
 * - Credentials are referenced by name; secrets are bound here at fetch
 *   time and never enter the artifact.
 * - Redirects are not followed, responses must be JSON, and both body size
 *   and row count are capped.
 */
export default function createHttpSource(options?: HttpSourceOptions): RestrictedSource {
	const originPolicies = buildOriginPolicies(options?.allowOrigins ?? []);
	const credentials = options?.credentials ?? {};
	const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
	const maxResponseBytes = options?.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
	const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
	const fetchImpl: typeof fetch =
		options?.fetch ?? ((input, init) => globalThis.fetch(input, init));

	return async (spec, context): Promise<unknown> => {
		const urlValue = spec.url;
		if (typeof urlValue !== "string") {
			throw new Error(`http requirement in "${context.artifactId}" is missing a url.`);
		}
		let url: URL;
		try {
			url = new URL(urlValue);
		} catch {
			throw new Error(`http requirement url is not valid: ${urlValue}`);
		}
		if (url.protocol !== "https:" && url.protocol !== "http:") {
			throw new Error(`http requirement url must use http: or https: (got ${url.protocol}).`);
		}
		if (url.username || url.password) {
			throw new Error("http requirement url must not embed credentials; use auth.");
		}
		if (!originPolicies.has(url.origin)) {
			const allowed = [...originPolicies.keys()].join(", ") || "(none)";
			throw new Error(
				`http requirement origin "${url.origin}" is not allowed by this deployment. Allowed origins: ${allowed}.`,
			);
		}
		const allowedFields = originPolicies.get(url.origin);
		if (isBlockedHostname(url.hostname)) {
			throw new Error(
				`http requirement host "${url.hostname}" is a private or local address and is blocked.`,
			);
		}

		const params = spec.params;
		if (params !== undefined) {
			if (params === null || typeof params !== "object" || Array.isArray(params)) {
				throw new Error('http requirement "params" must be an object.');
			}
			for (const [key, value] of Object.entries(params)) {
				if (value === null || value === undefined) continue;
				if (typeof value === "object") {
					throw new Error(`http requirement param "${key}" must be a primitive value.`);
				}
				url.searchParams.set(key, String(value));
			}
		}

		const headers: Record<string, string> = { accept: "application/json" };
		const authName = spec.auth;
		if (authName !== undefined) {
			if (typeof authName !== "string") {
				throw new Error('http requirement "auth" must be a credential name.');
			}
			const credential = credentials[authName];
			if (credential === undefined) {
				const configured = Object.keys(credentials).join(", ") || "(none)";
				throw new Error(
					`http requirement references credential "${authName}", which this deployment has not configured. Configured credentials: ${configured}.`,
				);
			}
			const header = (credential.header ?? "Authorization").toLowerCase();
			headers[header] = (credential.prefix ?? "") + credential.value;
		}

		let response: Response;
		try {
			response = await fetchImpl(url, {
				method: "GET",
				headers,
				redirect: "error",
				signal: timeoutSignal(timeout),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`http requirement request to ${url.origin}${url.pathname} failed: ${message}`,
			);
		}

		if (!response.ok) {
			throw new Error(
				`http requirement got HTTP ${response.status} from ${url.origin}${url.pathname}.`,
			);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!/application\/(?:[\w.+-]*\+)?json/i.test(contentType)) {
			throw new Error(
				`http requirement expected JSON from ${url.origin}${url.pathname} (content-type: ${contentType || "missing"}).`,
			);
		}

		const text = await readCapped(response, maxResponseBytes, url);
		let payload: unknown;
		try {
			payload = JSON.parse(text);
		} catch {
			throw new Error(`http requirement got invalid JSON from ${url.origin}${url.pathname}.`);
		}

		// Field narrowing runs BEFORE the author's `pick`: the operator's
		// allowlist describes what this origin may expose at all, so a pick
		// into a stripped path fails loudly instead of leaking through.
		if (allowedFields !== undefined) {
			payload = narrowValue(payload, allowedFields, url, 0);
		}

		let value = payload;
		const pick = spec.pick;
		if (typeof pick === "string" && pick.length > 0) {
			value = pickPath(payload, pick);
			if (value === undefined) {
				throw new Error(
					`http requirement pick path "${pick}" wasn't found in the response from ${url.origin}${url.pathname}.`,
				);
			}
		}

		if (Array.isArray(value)) {
			const specLimit =
				typeof spec.limit === "number" && Number.isInteger(spec.limit) && spec.limit > 0
					? spec.limit
					: maxRows;
			const limit = Math.min(specLimit, maxRows);
			if (value.length > limit) value = value.slice(0, limit);
		}

		return value;
	};
}

/**
 * Validates the origin list at creation time and maps each origin to its
 * field allowlist (`undefined` = unrestricted). Misconfiguration throws
 * here, naming the origin and field, instead of failing per render.
 */
function buildOriginPolicies(
	entries: Array<string | HttpOriginPolicy>,
): Map<string, Set<string> | undefined> {
	const policies = new Map<string, Set<string> | undefined>();
	for (const entry of entries) {
		const origin = typeof entry === "string" ? entry : entry?.origin;
		if (typeof origin !== "string" || origin.length === 0) {
			throw new Error(
				"createHttpSource origin entries must be origin strings or { origin, allowFields } objects.",
			);
		}
		if (policies.has(origin)) {
			throw new Error(`createHttpSource lists origin "${origin}" more than once.`);
		}
		const allowFields = typeof entry === "string" ? undefined : entry?.allowFields;
		if (allowFields === undefined) {
			policies.set(origin, undefined);
			continue;
		}
		if (!Array.isArray(allowFields)) {
			throw new Error(
				`createHttpSource allowFields for "${origin}" must be an array of field names.`,
			);
		}
		const fields = new Set<string>();
		for (const field of allowFields) {
			if (typeof field !== "string" || field.length === 0) {
				throw new Error(
					`createHttpSource allowFields for "${origin}" must contain non-empty field names.`,
				);
			}
			if (DANGEROUS_KEYS.has(field)) {
				throw new Error(
					`createHttpSource allowFields for "${origin}" contains the dangerous key "${field}".`,
				);
			}
			fields.add(field);
		}
		policies.set(origin, fields);
	}
	return policies;
}

/**
 * Deep-narrows a parsed JSON value to an origin's allowlisted fields: every
 * plain object — at every nesting level, including array elements — keeps
 * only the allowlisted keys. This also strips dangerous keys (`__proto__`
 * & co.), which are rejected from allowlists at creation time.
 */
function narrowValue(value: unknown, allowed: Set<string>, url: URL, depth: number): unknown {
	if (depth > MAX_NARROW_DEPTH) {
		throw new Error(
			`http requirement response from ${url.origin}${url.pathname} nests more than ${MAX_NARROW_DEPTH} levels deep.`,
		);
	}
	if (Array.isArray(value)) {
		return value.map((item) => narrowValue(item, allowed, url, depth + 1));
	}
	if (isPlainObject(value)) {
		const narrowed: Record<string, unknown> = {};
		for (const [key, item] of Object.entries(value)) {
			if (!allowed.has(key)) continue;
			narrowed[key] = narrowValue(item, allowed, url, depth + 1);
		}
		return narrowed;
	}
	return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object") return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

function timeoutSignal(timeout: number): AbortSignal | undefined {
	if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") {
		return undefined;
	}
	return AbortSignal.timeout(timeout);
}

function pickPath(payload: unknown, path: string): unknown {
	let current = payload;
	for (const segment of path.split(".")) {
		if (current === null || current === undefined) return undefined;
		if (DANGEROUS_KEYS.has(segment)) {
			throw new Error(`http requirement pick path uses a dangerous key: "${segment}".`);
		}
		if (/^\d+$/.test(segment)) {
			current = (current as Record<number, unknown>)[Number(segment)];
		} else {
			current = (current as Record<string, unknown>)[segment];
		}
	}
	return current;
}

async function readCapped(response: Response, maxBytes: number, url: URL): Promise<string> {
	const body = response.body;
	if (body === null) {
		const text = await response.text();
		if (new TextEncoder().encode(text).length > maxBytes) {
			throw new Error(
				`http requirement response from ${url.origin}${url.pathname} exceeded ${maxBytes} bytes.`,
			);
		}
		return text;
	}

	const reader = body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > maxBytes) {
				await reader.cancel().catch(() => {});
				throw new Error(
					`http requirement response from ${url.origin}${url.pathname} exceeded ${maxBytes} bytes.`,
				);
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	const merged = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(merged);
}

/**
 * Blocks obvious private/loopback targets (defense in depth on top of the
 * origin allowlist). Hostname-level DNS rebinding is the egress layer's job.
 */
function isBlockedHostname(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (host === "localhost" || host.endsWith(".localhost")) return true;
	if (host === "::1" || host === "::") return true;
	if (/^f[cd][0-9a-f]{2}:/.test(host)) return true; // fc00::/7 (ULA)
	if (/^fe[89ab][0-9a-f]:/.test(host)) return true; // fe80::/10 (link-local)

	const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
	if (ipv4 !== null) {
		const a = Number(ipv4[1]);
		const b = Number(ipv4[2]);
		if (a === 0 || a === 10 || a === 127) return true;
		if (a === 169 && b === 254) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a >= 224) return true; // multicast + reserved
	}
	return false;
}
