import { transform } from "sucrase";
import type EmbedArtifactImport from "../types/EmbedArtifactImport";
import EmbedCompileError from "../types/EmbedCompileError";

/**
 * Prepares client code to run against the loader-injected runtime exports:
 * exports become plain declarations and imports are removed.
 */
export function toClientCode(code: string): string {
	const stripped = code
		.replaceAll("export default function", "function")
		.replaceAll("export function", "function")
		// Compiled imports are always single-line
		.replace(/^import\s.+\n/gm, "");
	return transform(stripped, { transforms: ["typescript"] }).code;
}

const IMPORT_SCAN =
	/import\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\*\s+as\s+([A-Za-z_$][\w$]*)|\{([^}]*)\})?\s*from\s*["']([^"']+)["']/g;

/**
 * Records the bindings an embed's compiled code imports, per module: these
 * are the identifiers the loader must provide via the `scope` option (the
 * "@torpor/view" runtime is provided automatically, and type-only imports
 * are erased by the TypeScript transform, so neither is recorded).
 *
 * Handles the shapes the compiler and user code produce: named imports
 * (`import { A, B as C } from "x"`), default imports (`import D from "x"`),
 * namespaces (`import * as NS from "x"`) and combinations.
 */
export function scanImports(code: string): EmbedArtifactImport[] {
	const bySource = new Map<string, Set<string>>();
	for (const match of code.matchAll(IMPORT_SCAN)) {
		const [, defaultName, namespaceName, namedGroup, source] = match;
		if (source === "@torpor/view") continue;
		const names = bySource.get(source) ?? new Set<string>();
		if (defaultName) names.add(defaultName);
		if (namespaceName) names.add(namespaceName);
		if (namedGroup) {
			for (const part of namedGroup.split(",")) {
				const local =
					part
						.trim()
						.split(/\s+as\s+/)
						.pop()
						?.trim() ?? "";
				// Drop empty entries and inline type specifiers ("type X")
				if (local && !/^type\s/.test(part.trim())) names.add(local);
			}
		}
		if (names.size > 0) bySource.set(source, names);
	}
	return [...bySource].map(([source, names]) => ({ source, names: [...names].sort() }));
}

/**
 * Rejects embed sources over a byte limit, so a runaway author can't store
 * megabytes of code in one artifact.
 */
export function checkMaxSourceBytes(source: string, maxSourceBytes?: number): void {
	if (maxSourceBytes === undefined) return;
	const bytes = new TextEncoder().encode(source).length;
	if (bytes > maxSourceBytes) {
		throw new EmbedCompileError([
			{
				message: `Embed source is ${bytes} bytes, over the ${maxSourceBytes} byte limit`,
				startIndex: 0,
				startLine: 0,
				startChar: 0,
				endIndex: 0,
				endLine: 0,
				endChar: 0,
			},
		]);
	}
}
