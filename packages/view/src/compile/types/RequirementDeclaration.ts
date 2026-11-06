import type SourceSpan from "./SourceSpan";

/**
 * A file-level `data` declaration in restricted-mode templates:
 *
 * ```torp
 * data tickets from http { url: "…", params: { queue: $props.queue } };
 * ```
 *
 * The spec is inert data: keys and serialized expressions only (the values
 * may reference `$props`, but no code runs at parse or build time). The host
 * resolves the requirement before rendering; `$data.<name>` in the template
 * reads the result. The declaration is stripped from the compiled JS (the
 * builds bind `$data` from props instead).
 */
export default interface RequirementDeclaration {
	/** The bound name, e.g. `tickets` (read as `$data.tickets`). */
	name: string;
	/** The source kind, e.g. `http` or a host-registered kind. */
	kind: string;
	/** The raw spec source (the text between the braces). */
	spec: string;
	/** Absolute source index where the spec text begins. */
	specStart: number;
	/** The whole declaration, for stripping it from script chunks. */
	span: SourceSpan;
}
