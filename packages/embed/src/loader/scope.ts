import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * The modules a host provides to an embed, keyed by the specifier the embed
 * imported. Values are namespace-like objects: the loader flattens their
 * keys into the identifiers the compiled code can reference, so a scope of
 * `{ "@example/ui": uiModule }` lets an embed's `import { Form } from
 * "@example/ui"` resolve to `uiModule.Form`. Expose default exports as
 * named keys.
 *
 * Scope values are host-side objects (components, helpers) and cannot be
 * serialized, so the iframe tier cannot receive a scope -- sandboxed frames
 * can use slots and the bridge instead.
 */
export type EmbedScope = Record<string, unknown>;

/**
 * Flattens scope namespaces into a single identifier -> value table.
 * Later modules win on key collisions.
 */
export function flattenScope(scope: EmbedScope | undefined): Record<string, unknown> {
	if (!scope) return {};
	const flat: Record<string, unknown> = {};
	for (const value of Object.values(scope)) {
		if (value !== null && typeof value === "object") {
			for (const [key, entry] of Object.entries(value)) flat[key] = entry;
		}
	}
	return flat;
}

/**
 * Checks an artifact's recorded imports against the identifiers the loader
 * will inject (runtime exports + flattened scope), failing with the
 * missing bindings named -- so a forgotten scope entry is an actionable
 * error instead of a ReferenceError from inside compiled code.
 */
export function validateImports(
	artifact: Pick<EmbedArtifact, "id" | "imports">,
	injected: Record<string, unknown>,
): void {
	const keys = new Set(Object.keys(injected));
	for (const imported of artifact.imports ?? []) {
		const missing = imported.names.filter((name: string) => !keys.has(name));
		if (missing.length > 0) {
			throw new Error(
				`Embed "${artifact.id}" imports ${missing
					.map((name: string) => `"${name}"`)
					.join(
						", ",
					)} from "${imported.source}", which the host did not provide. Pass scope: { "${imported.source}": ... } to mountEmbed/hydrateEmbed. Scope values cannot cross the iframe boundary.`,
			);
		}
	}
}
