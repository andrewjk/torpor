import type {
	CompileError,
	RestrictedExpr,
	RestrictedRequirement,
	RestrictedRequirementKindValidator,
	RestrictedSpecEntry,
} from "@torpor/view/compile";
import { parseExpressionPrefix, RestrictedSyntaxError } from "@torpor/view/compile";
import { DERIVE_EXPRESSION_KEYS } from "../restricted/derive/deriveRequirementKind";

/**
 * A value in an app manifest. Strings may be `$props.<path>` references
 * (`"$props.word"`, `"$props.query.id"`), resolved against the render props;
 * everything else is an inert literal. Manifests are JSON — nothing in them
 * executes, which is what keeps the restricted tier safe.
 */
export type ManifestValue =
	| string
	| number
	| boolean
	| null
	| ManifestValue[]
	| { [key: string]: ManifestValue };

/**
 * One data requirement: `kind` names the source implementation (e.g. "http"),
 * and the remaining keys are the spec the host's source receives.
 */
export interface ManifestRequirement {
	kind: string;
	[key: string]: ManifestValue;
}

/**
 * The author-facing app declaration. This is inert data (JSON after
 * evaluation) describing the app: its id, default props, and the data
 * requirements that feed `$data`.
 *
 * For restricted embeds, data lives here — the template stays plain
 * torpor, and the manifest is typed at author time via `defineApp`.
 */
export interface AppManifest {
	/** Stable app id: lowercase letters, digits and dashes. */
	id: string;
	/** Default props for the first render (embed/render props override). */
	props?: Record<string, ManifestValue>;
	/** Data requirements, keyed by the `$data.<name>` they bind. */
	data?: Record<string, ManifestRequirement>;
}

/**
 * Types an app manifest and returns it unchanged — the author-time helper
 * for writing `WordLookup.app.ts`. The result is plain JSON: a host can
 * store it and compile against it without executing anything.
 *
 * @param manifest The app's id, default props and data requirements.
 */
export default function defineApp(manifest: AppManifest): AppManifest {
	return manifest;
}
/** Converts a manifest value to the inert expression tree the renderer uses. */
export function manifestExpr(value: ManifestValue): RestrictedExpr {
	if (typeof value === "string" && /^\$props(\.|$)/.test(value)) {
		const path = value.slice("$props".length).split(".").filter(Boolean);
		let expr: RestrictedExpr = { op: "ref", name: "$props" };
		for (const key of path) {
			expr = { op: "get", object: expr, key };
		}
		return expr;
	}
	if (Array.isArray(value)) {
		return { op: "array", items: value.map(manifestExpr) };
	}
	if (value !== null && typeof value === "object") {
		const entries: Record<string, RestrictedExpr> = {};
		for (const [key, child] of Object.entries(value)) {
			entries[key] = manifestExpr(child);
		}
		return { op: "object", entries };
	}
	return { op: "lit", value: value as string | number | boolean | null };
}

/**
 * Manifest values for a derive's expression keys (`where`, `map`,
 * `sortBy`, the aggregates) are expression **source**: parsed at save time
 * with the restricted expression grammar — calls to host formatters
 * allowed, row scope (`$item`/`$index`) and `$props` referencable — so the
 * manifest stays inert JSON. Parse failures become compile errors naming
 * the requirement.
 */
function deriveManifestExpr(
	value: ManifestValue,
	name: string,
	report: (message: string) => void,
): RestrictedExpr {
	if (typeof value === "string") {
		try {
			return parseExpressionPrefix(value, 0, { allowCalls: true }).expression;
		} catch (error) {
			if (error instanceof RestrictedSyntaxError) {
				report(`data "${name}": ${error.message}`);
				return { op: "lit", value: "" };
			}
			throw error;
		}
	}
	if (Array.isArray(value)) {
		return { op: "array", items: value.map((item) => deriveManifestExpr(item, name, report)) };
	}
	if (value !== null && typeof value === "object") {
		const entries: Record<string, RestrictedExpr> = {};
		for (const [key, child] of Object.entries(value)) {
			entries[key] = deriveManifestExpr(child as ManifestValue, name, report);
		}
		return { op: "object", entries };
	}
	return { op: "lit", value: value as string | number | boolean | null };
}

/**
 * Converts an app manifest's `data` block into the same requirement list the
 * in-torp `data … from …` syntax produces, validating each requirement
 * against the registered kinds (unknown kinds and malformed specs are
 * compile errors).
 *
 * Requirements resolve in declaration order, so `derive` can reference the
 * requirements declared before it — the manifest's key order is preserved.
 *
 * @param data The manifest `data` block.
 * @param requirementKinds The compile-time kinds available (e.g. built-ins
 *   registered by the host, plus any first-party kinds).
 */
export function manifestRequirements(
	data: Record<string, ManifestRequirement>,
	requirementKinds: Record<string, RestrictedRequirementKindValidator> | undefined,
): { requirements: RestrictedRequirement[]; errors: CompileError[] } {
	const requirements: RestrictedRequirement[] = [];
	const errors: CompileError[] = [];
	const names: string[] = [];

	const report = (message: string) => {
		errors.push({
			message,
			startIndex: 0,
			startLine: 0,
			startChar: 0,
			endIndex: 0,
			endLine: 0,
			endChar: 0,
		});
	};

	for (const [name, requirement] of Object.entries(data)) {
		if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
			report(`Invalid data requirement name "${name}" (must be an identifier).`);
			continue;
		}
		if (typeof requirement !== "object" || requirement === null) {
			report(`Data requirement "${name}" must be an object with a "kind".`);
			continue;
		}
		const { kind, ...specValues } = requirement;
		if (typeof kind !== "string" || kind === "") {
			report(`Data requirement "${name}" is missing a "kind".`);
			continue;
		}
		const entries: RestrictedSpecEntry[] = Object.entries(specValues).map(([key, value]) => {
			const expr =
				kind === "derive" && DERIVE_EXPRESSION_KEYS.has(key)
					? deriveManifestExpr(value as ManifestValue, name, report)
					: manifestExpr(value as ManifestValue);
			return { key, expr, keyStart: 0, valueStart: 0, valueEnd: 0 };
		});
		const validator = requirementKinds?.[kind];
		if (validator === undefined) {
			report(
				`Unknown data requirement kind "${kind}" (needed by "${name}"). Enable it in the host's requirementKinds.`,
			);
			continue;
		}
		let kindErrors = 0;
		validator(
			entries,
			(message) => {
				kindErrors++;
				report(`data "${name}": ${message}`);
			},
			{ name, names: [...names] },
		);
		if (kindErrors > 0) {
			continue;
		}
		const spec: Record<string, RestrictedExpr> = {};
		for (const entry of entries) {
			spec[entry.key] = entry.expr;
		}
		requirements.push({ name, kind, spec });
		names.push(name);
	}

	return { requirements, errors };
}
