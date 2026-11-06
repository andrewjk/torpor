import { parse, build, type CompileError } from "@torpor/view/compile";
import { transform } from "sucrase";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedArtifactImport from "../types/EmbedArtifactImport";
import EmbedCompileError from "../types/EmbedCompileError";
import { RUNTIME_VERSION } from "../generated/version";

export interface CompileEmbedOptions {
	/**
	 * The version to stamp the artifact with. Defaults to RUNTIME_VERSION,
	 * the @torpor/view version this package was built against.
	 */
	version?: string;

	/**
	 * Whether to preserve whitespace in templates. Passed through to
	 * `build` in @torpor/view/compile.
	 */
	preserveWhitespace?: boolean;

	/**
	 * Maximum embed source size in bytes (UTF-8). Larger sources are
	 * rejected with a compile error -- a backstop so a runaway author
	 * can't store megabytes of code in one artifact. Default: no limit.
	 */
	maxSourceBytes?: number;

	/**
	 * Compile the client build as a real ES module (artifact `format:
	 * "module"`): TypeScript is removed but imports and the default export
	 * are kept, and the code is loaded with mountModuleEmbed /
	 * hydrateModuleEmbed instead of the injected-globals loader.
	 */
	module?: boolean;

	/**
	 * Rewrites import specifiers in the module client build, e.g. turning
	 * the bare "@torpor/view" into a versioned runtime URL your server
	 * hosts:
	 *
	 * `(spec) => (spec === "@torpor/view" ? `/modules/@torpor/view@${version}/index.mjs` : undefined)`
	 *
	 * Returning undefined keeps the specifier as-is (a bare specifier needs
	 * an import map on the host page to resolve). Only used with
	 * `module: true`.
	 */
	resolveImport?: (specifier: string) => string | undefined;

	/**
	 * The module specifiers the embed is allowed to import from, besides
	 * "@torpor/view" (always allowed). When set, an import from any other
	 * module is a compile error -- useful in editors, so an admin
	 * importing something the host never provides finds out on save.
	 * Recorded imports (artifact.imports) are validated again at
	 * mount/render time against the host-provided `scope`.
	 */
	scope?: string[];
}

/**
 * Compiles .torp source into an embed artifact, at publish time: when a
 * REPL user saves, a feed post author submits, or an admin publishes a
 * custom section.
 *
 * The artifact is plain JSON: store the whole thing (including `source` --
 * it's the source of truth for recompiles when the runtime is upgraded) and
 * serve it to clients, where the loaders run it.
 *
 * This entry has no Node builtins: it runs in Node, workers, and browsers
 * alike. Imports the embed declares from other modules are recorded in
 * `artifact.imports` and must be provided by the host at mount/render time
 * via the `scope` option (see README).
 *
 * @param id A stable id for the embed, unique within the host app
 * @param source The .torp source to compile
 */
export default function compileEmbed(
	id: string,
	source: string,
	options?: CompileEmbedOptions,
): EmbedArtifact {
	checkMaxSourceBytes(source, options?.maxSourceBytes);

	const parsed = parse(source);
	if (!parsed.ok || !parsed.template) {
		throw new EmbedCompileError(parsed.errors);
	}
	const template = parsed.template;
	const component = template.components.find((c) => c.default && c.name);
	if (!component?.name) {
		const error: CompileError = {
			message: "The embed must have a default export component",
			startIndex: 0,
			startLine: 0,
			startChar: 0,
			endIndex: 0,
			endLine: 0,
			endChar: 0,
		};
		throw new EmbedCompileError([error]);
	}

	const client = build(template);
	if (client.errors.length > 0) {
		throw new EmbedCompileError(client.errors);
	}
	const imports = scanImports(client.code);
	if (options?.scope) {
		const allowed = new Set(["@torpor/view", ...options.scope]);
		const outside = imports.filter((imp) => !allowed.has(imp.source));
		if (outside.length > 0) {
			const first = outside[0];
			throw new EmbedCompileError([
				{
					message: `Import "${first.source}" is not in the compile scope. Add it: compileEmbed(..., { scope: ["${first.source}"] }) -- and provide it at mount/render time via the scope option.`,
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

	const server = build(template, {
		server: true,
		preserveWhitespace: options?.preserveWhitespace,
	});

	return {
		id,
		name: component.name,
		version: options?.version ?? RUNTIME_VERSION,
		source,
		format: options?.module ? "module" : "globals",
		imports: imports.length > 0 ? imports : undefined,
		client: {
			code: options?.module
				? toModuleClientCode(client.code, options.resolveImport)
				: toClientCode(client.code),
		},
		server: { code: toServerCode(server.code) },
		styles: client.styles,
	};
}

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

/**
 * Prepares client code as a real ES module: TypeScript is removed (type-only
 * imports disappear with it), imports are kept with specifiers rewritten
 * through `resolveImport`, and the default export stays.
 */
function toModuleClientCode(
	code: string,
	resolveImport?: (specifier: string) => string | undefined,
): string {
	const js = transform(code, { transforms: ["typescript"] }).code;
	if (!resolveImport) return js;
	// Generated imports are single-line, and helpers that sucrase hoists
	// (e.g. _nullishCoalesce) can land above them, so don't rely on line
	// anchors here either
	return js.replace(
		/(import\s[^;'"]*["'])([^"' ]+)(["'])/g,
		(match, before: string, specifier: string, after: string) => {
			const rewritten = resolveImport(specifier);
			return rewritten ? `${before}${rewritten}${after}` : match;
		},
	);
}

/**
 * Prepares server code as a self-contained ES module: TypeScript is removed
 * but imports are kept, so a host can save it to disk and import it with its
 * own node_modules resolution.
 */
function toServerCode(code: string): string {
	return transform(code, { transforms: ["typescript"] }).code;
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
 * megabytes of code in one artifact. Shared with `compileRestricted`.
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
