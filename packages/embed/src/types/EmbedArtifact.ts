import type { RestrictedProgram } from "@torpor/view/compile";
import type EmbedArtifactImport from "./EmbedArtifactImport";

/**
 * A component authored at runtime (by a REPL user, a feed post author, an
 * admin building a custom section), compiled at publish time and stored as
 * plain data.
 *
 * The whole artifact is JSON-serializable, so it can be stored in a database
 * and served as part of an API response.
 */
export default interface EmbedArtifact {
	/**
	 * The embed's stable id, unique per host app. Used to dedupe injected
	 * styles and to key caches.
	 */
	id: string;

	/**
	 * The name of the component to render: the template's default export.
	 */
	name: string;

	/**
	 * The version of @torpor/view (its compiler and runtime) that the code
	 * was built with. Compiled code references the runtime's internal helpers
	 * (`t_anchor`, `t_fragment` etc.), so an artifact can only run against a
	 * matching runtime version.
	 */
	version: string;

	/**
	 * The original .torp source. This is the source of truth: the compiled
	 * code is a cache that can be regenerated whenever the runtime is
	 * upgraded. Never store compiled artifacts without their source.
	 */
	source: string;

	/**
	 * How the client build must be run:
	 *
	 * - "globals" (default): imports are stripped and TypeScript is removed;
	 * the code runs against the runtime functions injected by the loader.
	 * - "module": TypeScript is removed but imports and the default export
	 * are kept as a real ES module; import specifiers may have been
	 * rewritten by the compiler's `resolveImport` option. Run it with
	 * mountModuleEmbed/hydrateModuleEmbed.
	 * - "restricted": the server build is a serialized instruction tree
	 * (no JS, no eval) interpreted by `renderRestricted` from
	 * `@torpor/embed/restricted`; the client build is ordinary globals-format
	 * code. Compile with `compileRestricted`.
	 */
	format?: "globals" | "module" | "restricted";

	/**
	 * The modules the embed imports from (besides the runtime, which is
	 * provided automatically), with the local binding names its code
	 * references. The loaders validate these against the host's `scope`
	 * option and fail loudly -- naming the missing bindings -- instead of
	 * throwing ReferenceErrors from inside compiled code.
	 */
	imports?: EmbedArtifactImport[];

	/**
	 * The client build. Imports are stripped and TypeScript is removed, so
	 * the code runs against the runtime functions injected by the loader.
	 */
	client: {
		code: string;
	};

	/**
	 * The server build.
	 *
	 * - For JS formats (globals/module): `code` is an ES module (TypeScript
	 *   removed, imports kept) that a host can save to disk and import with
	 *   its own node_modules resolution. Running untrusted code on the server
	 *   is a remote code execution risk: sandbox it before rendering embeds
	 *   from authors you don't fully trust.
	 * - For the restricted format: `template` is the serialized instruction
	 *   tree interpreted by `renderRestricted` (no code execution).
	 */
	server?: {
		code?: string;
		template?: RestrictedProgram;
	};

	/**
	 * Scoped styles for the embed's components.
	 */
	styles: EmbedStyle[];

	/**
	 * Arbitrary host-specific metadata (author id, publish date, etc).
	 */
	meta?: Record<string, unknown>;
}

export interface EmbedStyle {
	/**
	 * The generated CSS.
	 */
	style: string;

	/**
	 * The hash used to scope the CSS to the component.
	 */
	hash: string;
}
