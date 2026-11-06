import type { RestrictedRequirementKindValidator, RestrictedSpecEntry } from "@torpor/view/compile";

/**
 * The compile-time shape of `data <name> from http { … }` declarations.
 *
 * Pass it to `compileRestricted` (and `recompileRestricted`) under
 * `requirementKinds.http` so admins get authoring-time errors:
 *
 * ```ts
 * compileRestricted(id, source, { requirementKinds: { http: httpRequirementKind } });
 * ```
 *
 * Shape (v1, GET only):
 *
 * ```torp
 * data tickets from http {
 * 	url: "https://api.example.com/tickets",  // string literal; no props
 * 	auth: "corp-key",                        // credential name (host-side secret)
 * 	params: { queue: $props.queue },         // query params; literal keys
 * 	pick: "items",                           // dot path into the response JSON
 * 	limit: 100,                              // optional row cap
 * };
 * ```
 *
 * The runtime side is `createHttpSource`, where the operator configures
 * allowed origins, credential bindings and limits.
 */
const HTTP_SPEC_KEYS = new Set(["url", "auth", "params", "pick", "limit"]);

function literalString(entry: RestrictedSpecEntry): string | undefined {
	return entry.expr.op === "lit" && typeof entry.expr.value === "string"
		? entry.expr.value
		: undefined;
}

const httpRequirementKind: RestrictedRequirementKindValidator = (entries, report) => {
	let sawUrl = false;

	for (const entry of entries) {
		if (!HTTP_SPEC_KEYS.has(entry.key)) {
			report(
				`Unknown http spec key "${entry.key}". Allowed: url, auth, params, pick, limit.`,
				entry.keyStart,
				entry.valueEnd,
			);
			continue;
		}

		switch (entry.key) {
			case "url": {
				sawUrl = true;
				const value = literalString(entry);
				if (value === undefined) {
					report(
						'http "url" must be a string literal (props can go in params, never in the origin).',
						entry.valueStart,
						entry.valueEnd,
					);
					break;
				}
				let url: URL;
				try {
					url = new URL(value);
				} catch {
					report(`http "url" is not a valid URL: ${value}`, entry.valueStart, entry.valueEnd);
					break;
				}
				if (url.protocol !== "https:" && url.protocol !== "http:") {
					report(
						`http "url" must use http: or https: (got ${url.protocol}).`,
						entry.valueStart,
						entry.valueEnd,
					);
				}
				if (url.username || url.password) {
					report(
						'http "url" must not embed credentials; reference a credential name via "auth" instead.',
						entry.valueStart,
						entry.valueEnd,
					);
				}
				break;
			}
			case "auth": {
				if (literalString(entry) === undefined) {
					report(
						'http "auth" must be a credential name string literal (the secret stays host-side).',
						entry.valueStart,
						entry.valueEnd,
					);
				}
				break;
			}
			case "params": {
				if (entry.expr.op !== "object") {
					report(
						'http "params" must be an object literal, e.g. { queue: $props.queue }.',
						entry.valueStart,
						entry.valueEnd,
					);
					break;
				}
				for (const [key, value] of Object.entries(entry.expr.entries)) {
					if (
						value.op !== "lit" &&
						value.op !== "get" &&
						value.op !== "index" &&
						value.op !== "ternary" &&
						value.op !== "binary" &&
						value.op !== "unary" &&
						value.op !== "call"
					) {
						report(
							`http param "${key}" must evaluate to a primitive (string, number or boolean).`,
							entry.valueStart,
							entry.valueEnd,
						);
					}
				}
				break;
			}
			case "pick": {
				const value = literalString(entry);
				if (value === undefined) {
					report(
						'http "pick" must be a string literal dot path, e.g. "items".',
						entry.valueStart,
						entry.valueEnd,
					);
					break;
				}
				if (value.split(".").some((segment) => segment.trim() === "")) {
					report(
						`http "pick" path "${value}" has an empty segment.`,
						entry.valueStart,
						entry.valueEnd,
					);
				}
				break;
			}
			case "limit": {
				const value = entry.expr.op === "lit" ? entry.expr.value : undefined;
				if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
					report(
						'http "limit" must be a positive integer literal.',
						entry.valueStart,
						entry.valueEnd,
					);
				}
				break;
			}
		}
	}

	if (!sawUrl) {
		report('http requirements need a "url" string literal.', 0, 0);
	}
};

export default httpRequirementKind;
