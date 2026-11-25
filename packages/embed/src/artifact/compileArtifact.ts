import { bindDataTemplate, build, buildRestricted, parse } from "@torpor/view/compile";
import type { CompileError, RestrictedRequirementKindValidator } from "@torpor/view/compile";
import { type ManifestApiMethod, type ManifestRequirement, manifestRequirements } from "../app";
import { checkBridgeSurface, scanBridgeUsage } from "../app/bridgeSurface";
import { checkMaxSourceBytes, scanImports, toClientCode } from "./client";
import { RUNTIME_VERSION } from "../generated/version";
import EmbedCompileError from "../types/EmbedCompileError";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedSurface from "../types/EmbedSurface";

export interface CompileArtifactOptions {
	/**
	 * The version to stamp the artifact with. Defaults to RUNTIME_VERSION,
	 * the @torpor/view version this package was built against.
	 */
	version?: string;

	/** Preserve template whitespace (passed through to the builds). */
	preserveWhitespace?: boolean;

	/** Reject sources over this many UTF-8 bytes. */
	maxSourceBytes?: number;

	/**
	 * The data requirement kinds available to this build, keyed by kind
	 * name. Unknown kinds are a compile error, so an admin using a data
	 * source the host doesn't enable finds out at save time.
	 */
	requirementKinds?: Record<string, RestrictedRequirementKindValidator>;

	/**
	 * The app manifest's data requirements (`defineApp().data`), keyed by
	 * the `$data.<name>` they bind — the only place data requirements are
	 * declared. Specs are validated against `requirementKinds` at compile
	 * time; `$props` references stay symbolic until the host resolves them,
	 * and derive expressions are strings parsed at save time.
	 */
	data?: Record<string, ManifestRequirement>;

	/**
	 * The app manifest's declared bridge surface (`defineApp().api`) — the
	 * methods the embed may `invoke`. **Default deny**: an embed that
	 * invokes without this block, or calls a method outside it, is a
	 * compile error. The declared names are compiled onto the artifact as
	 * its `surface`, so the loaders can also warn at mount time.
	 */
	api?: Record<string, ManifestApiMethod>;

	/** The event types the embed may `emit` — enforced like `api`. */
	emits?: string[];

	/** The push types the embed may subscribe to — enforced like `api`. */
	pushes?: string[];

	/**
	 * The module specifiers the embed is allowed to import from, besides
	 * "@torpor/view" (always allowed). When set, an import from any other
	 * module is a compile error — useful in editors, so an author importing
	 * something the host never provides finds out on save. Recorded imports
	 * (artifact.imports) are validated again at mount time against the
	 * host-provided `scope`.
	 */
	scope?: string[];

	/** Host metadata carried through recompiles. */
	meta?: Record<string, unknown>;
}

/**
 * Compiles .torp source into an embed artifact: the server
 * build is a serialized instruction tree (no JS, no eval), while the client
 * build is ordinary globals-format torpor code (mounted with `mountEmbed`).
 *
 * Requirement specs (`data tickets from http { … }`) are validated against
 * `requirementKinds` at compile time; `$props` references in specs stay
 * symbolic until the host resolves them.
 *
 * Edge-safe (no Node builtins): runs in Node, workers, and browsers alike.
 */
export default function compileArtifact(
	id: string,
	source: string,
	options?: CompileArtifactOptions,
): EmbedArtifact {
	checkMaxSourceBytes(source, options?.maxSourceBytes);

	const parsed = parse(source, { allowUnknownComponents: true });
	if (!parsed.ok || !parsed.template) {
		throw new EmbedCompileError(parsed.errors);
	}
	const template = parsed.template;

	const component = template.components.find((candidate) => candidate.default && candidate.name);
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

	// The restricted build (view's buildRestricted) must run before build(): it maps text
	// interpolations through parse-time spans, and build() trims whitespace
	// nodes in place (invalidating those spans).
	const restricted = buildRestricted(template, {
		source,
		preserveWhitespace: options?.preserveWhitespace,
	});
	if (restricted.errors.length > 0) {
		throw new EmbedCompileError(restricted.errors);
	}

	// Data requirements come from the app manifest only. When there are
	// any, bind `$data` (the client build reads the host-resolved bag
	// through `$props.$data`); templates without requirements skip it.
	const manifest = manifestRequirements(options?.data ?? {}, options?.requirementKinds);
	if (manifest.errors.length > 0) {
		throw new EmbedCompileError(manifest.errors);
	}
	if (manifest.requirements.length > 0) {
		bindDataTemplate(template);
	}

	const client = build(template, { preserveWhitespace: options?.preserveWhitespace });
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
					message: `Import "${first.source}" is not in the compile scope. Add it: compileArtifact(..., { scope: ["${first.source}"] }) -- and provide it at mount time via the scope option.`,
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

	// Declared bridge surface, with default deny: an embed that uses the
	// bridge must declare its surface, and calls outside the declaration
	// are compile errors (dynamic names warn at runtime instead).
	const surfaceErrors = checkBridgeSurface(scanBridgeUsage(client.code), {
		api: options?.api,
		emits: options?.emits,
		pushes: options?.pushes,
	});
	if (surfaceErrors.length > 0) {
		throw new EmbedCompileError(surfaceErrors);
	}

	return {
		id,
		name: component.name,
		version: options?.version ?? RUNTIME_VERSION,
		source,
		imports: imports.length > 0 ? imports : undefined,
		client: { code: toClientCode(client.code) },
		server: { template: { ...restricted.program, requirements: manifest.requirements } },
		styles: restricted.styles,
		meta: options?.meta,
		surface: bridgeSurface(options),
	};
}

/**
 * Compiles the declared bridge surface onto the artifact, so the loaders
 * can warn at mount time when a call steps outside it.
 */
function bridgeSurface(options?: CompileArtifactOptions): EmbedSurface | undefined {
	const { api, emits, pushes } = options ?? {};
	if (api === undefined && emits === undefined && pushes === undefined) return undefined;
	return {
		api: api === undefined ? undefined : Object.keys(api),
		emits,
		pushes,
	};
}
