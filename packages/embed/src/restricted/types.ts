import type EmbedBridge from "../types/EmbedBridge";
import type EmbedStyle from "../types/EmbedStyle";

/**
 * What a first-party requirement implementation receives alongside the
 * evaluated spec.
 */
export interface RestrictedSourceContext {
	artifactId: string;
	props: Record<string, any>;
}

/**
 * A first-party implementation of a `data <name> from <kind> { … }`
 * requirement. The spec arrives with its expressions already evaluated
 * (props references resolved; no code runs in the spec), and the return
 * value becomes `$data.<name>` in the template.
 *
 * This is the trusted boundary: authorization, tenant scoping and network
 * access live here, in host code — never in the artifact.
 */
export type RestrictedSource = (
	spec: Record<string, unknown>,
	context: RestrictedSourceContext,
) => unknown; // may be a promise; awaited by the renderer

export interface RenderRestrictedOptions {
	/** Props for the component (`$props` in the template). */
	props?: Record<string, any>;

	/**
	 * A pre-resolved data bag. When provided, requirements are not resolved
	 * and `sources` is ignored — useful when the host fetched data itself.
	 */
	data?: Record<string, unknown>;

	/**
	 * First-party implementations, keyed by requirement kind. Required for
	 * every kind used by the artifact (unless `data` is provided).
	 */
	sources?: Record<string, RestrictedSource>;

	/**
	 * The bridge, injected as the `$embed` prop (for any client-side code in
	 * the client build; restricted templates themselves cannot call it).
	 */
	bridge?: EmbedBridge;

	/**
	 * The expected runtime version. Defaults to `RUNTIME_VERSION` (the
	 * @torpor/view version this package was built against) — the edge-safe
	 * equivalent of `getRuntimeVersion()`.
	 */
	runtimeVersion?: string;

	/** Log a warning and continue on a version mismatch instead of throwing. */
	allowVersionMismatch?: boolean;
}

export interface RestrictedRenderResult {
	body: string;
	head: string;
	styles: EmbedStyle[];
}
