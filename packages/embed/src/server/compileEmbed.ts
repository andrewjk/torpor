import { parse, build, type CompileError } from "@torpor/view/compile";
import { transform } from "sucrase";
import type EmbedArtifact from "../types/EmbedArtifact";
import EmbedCompileError from "../types/EmbedCompileError";
import getRuntimeVersion from "./getRuntimeVersion";

export interface CompileEmbedOptions {
	/**
	 * The version to stamp the artifact with. Defaults to the installed
	 * @torpor/view's version, which is almost always what you want.
	 */
	version?: string;

	/**
	 * Whether to preserve whitespace in templates. Passed through to
	 * `build` in @torpor/view/compile.
	 */
	preserveWhitespace?: boolean;

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
}

/**
 * Compiles .torp source into an embed artifact, at publish time: when a
 * REPL user saves, a feed post author submits, or an admin publishes a
 * custom section.
 *
 * The artifact is plain JSON: store the whole thing (including `source` --
 * it's the source of truth for recompiles when the runtime is upgraded) and
 * serve it to clients, where `mountEmbed`/`hydrateEmbed` run it.
 *
 * @param id A stable id for the embed, unique within the host app
 * @param source The .torp source to compile
 */
export default function compileEmbed(
	id: string,
	source: string,
	options?: CompileEmbedOptions,
): EmbedArtifact {
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
	const server = build(template, {
		server: true,
		preserveWhitespace: options?.preserveWhitespace,
	});

	return {
		id,
		name: component.name,
		version: options?.version ?? getRuntimeVersion(),
		source,
		format: options?.module ? "module" : "globals",
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
function toClientCode(code: string): string {
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
