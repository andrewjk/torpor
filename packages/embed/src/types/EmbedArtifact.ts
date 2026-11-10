import type { RestrictedProgram } from "@torpor/view/compile";
import type EmbedArtifactImport from "./EmbedArtifactImport";
import type EmbedSurface from "./EmbedSurface";

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
	 * The serialized server build: the instruction tree interpreted by
	 * `renderArtifact` (no code execution).
	 */
	server?: {
		template: RestrictedProgram;
	};

	/**
	 * Scoped styles for the embed's components.
	 */
	styles: EmbedStyle[];

	/**
	 * Arbitrary host-specific metadata (author id, publish date, etc).
	 */
	meta?: Record<string, unknown>;

	/**
	 * The bridge surface declared in the app manifest (`api`/`emits`/
	 * `pushes`), if any. Compile time enforces the embed's calls against
	 * it; at mount time the loaders warn when a call steps outside a
	 * declared section. Absent when the manifest declares no surface.
	 */
	surface?: EmbedSurface;
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
