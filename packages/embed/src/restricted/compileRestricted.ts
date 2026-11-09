import { bindDataTemplate, build, buildRestricted, parse } from "@torpor/view/compile";
import type { CompileError, RestrictedRequirementKindValidator } from "@torpor/view/compile";
import { type ManifestRequirement, manifestRequirements } from "../app";
import { checkMaxSourceBytes, scanImports, toClientCode } from "../compile/compileEmbed";
import { RUNTIME_VERSION } from "../generated/version";
import EmbedCompileError from "../types/EmbedCompileError";
import type EmbedArtifact from "../types/EmbedArtifact";

export interface CompileRestrictedOptions {
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
	 * Data requirements as an app manifest (`defineApp().data`) instead of
	 * in-torp `data … from …` declarations, so the template stays plain
	 * torpor. Use one style or the other, not both.
	 */
	data?: Record<string, ManifestRequirement>;

	/** Host metadata carried through recompiles. */
	meta?: Record<string, unknown>;
}

/**
 * Compiles .torp source into a **restricted** embed artifact: the server
 * build is a serialized instruction tree (no JS, no eval), while the client
 * build is ordinary globals-format torpor code (mounted with `mountEmbed`).
 *
 * Requirement specs (`data tickets from http { … }`) are validated against
 * `requirementKinds` at compile time; `$props` references in specs stay
 * symbolic until the host resolves them.
 *
 * Edge-safe (no Node builtins), like `compileEmbed`.
 */
export default function compileRestricted(
	id: string,
	source: string,
	options?: CompileRestrictedOptions,
): EmbedArtifact {
	checkMaxSourceBytes(source, options?.maxSourceBytes);

	const parsed = parse(source);
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

	// The restricted build must run before build(): it maps text
	// interpolations through parse-time spans, and build() trims whitespace
	// nodes in place (invalidating those spans).
	const restricted = buildRestricted(template, {
		source,
		requirementKinds: options?.requirementKinds,
		preserveWhitespace: options?.preserveWhitespace,
	});
	if (restricted.errors.length > 0) {
		throw new EmbedCompileError(restricted.errors);
	}

	// Data requirements come from the manifest (plain-torpor templates) or
	// the in-torp `data … from …` declarations, never both
	let requirements = restricted.program.requirements;
	if (options?.data !== undefined) {
		if (requirements.length > 0) {
			const error: CompileError = {
				message:
					"Declare data requirements in the app manifest or as `data … from …` in the source, not both.",
				startIndex: 0,
				startLine: 0,
				startChar: 0,
				endIndex: 0,
				endLine: 0,
				endChar: 0,
			};
			throw new EmbedCompileError([error]);
		}
		const manifest = manifestRequirements(options.data, options.requirementKinds);
		if (manifest.errors.length > 0) {
			throw new EmbedCompileError(manifest.errors);
		}
		requirements = manifest.requirements;
		// The in-source path binds `$data` at parse time; a manifest has no
		// declarations to scan, so install the same binding for the client
		// build (`$props.$data` is where the host passes the resolved bag)
		bindDataTemplate(template);
	}

	const client = build(template, { preserveWhitespace: options?.preserveWhitespace });
	if (client.errors.length > 0) {
		throw new EmbedCompileError(client.errors);
	}

	const imports = scanImports(client.code);

	return {
		id,
		name: component.name,
		version: options?.version ?? RUNTIME_VERSION,
		source,
		format: "restricted",
		imports: imports.length > 0 ? imports : undefined,
		client: { code: toClientCode(client.code) },
		server: { template: { ...restricted.program, requirements } },
		styles: restricted.styles,
		meta: options?.meta,
	};
}
