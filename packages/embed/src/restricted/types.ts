import type { ServerComponent } from "@torpor/view/ssr";
import type EmbedBridge from "../types/EmbedBridge";
import type EmbedStyle from "../types/EmbedStyle";
import type { DeriveLimits } from "./derive/resolveDerive";

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

/**
 * One resolved data requirement, reported to `renderRestricted`'s
 * `onAudit` hook — the "record what was read" half of the trusted
 * boundary. One entry per requirement per render, for host sources and
 * `derive` alike, on success and failure.
 */
export interface RestrictedAuditEntry {
	/** The artifact whose requirement was resolved. */
	artifactId: string;
	/** The requirement name, as it appears in `$data`. */
	name: string;
	/** The requirement kind (`"http"`, a host kind, or `"derive"`). */
	kind: string;
	/**
	 * The requirement's inert declaration — the url, the credential
	 * *name*, the pick path — never fetched data or secrets. Evaluated
	 * (props resolved) for host source kinds; for `derive`, only the
	 * fields that evaluate statically (`of`, `limit`, `order`, aggregate
	 * flags — per-row expressions like `where` are omitted).
	 */
	spec: Record<string, unknown>;
	/** Wall-clock duration of the resolution in milliseconds. */
	durationMs: number;
	/** Whether the resolution succeeded. */
	ok: boolean;
	/** The error message when the resolution failed. */
	error?: string;
}

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
	 * Audit hook: called once per resolved data requirement with what was
	 * read (see {@link RestrictedAuditEntry}). Fires for host sources and
	 * `derive` alike, on success and failure — failures are reported, then
	 * rethrown, so auditing never swallows an error. Not called when the
	 * host passes pre-resolved `data`, because nothing was read.
	 */
	onAudit?: (entry: RestrictedAuditEntry) => void;

	/**
	 * Host **server components** available to the template, keyed by usage
	 * name: `<Card title={x}>…</Card>` calls `components.Card` (a server
	 * component — e.g. the server build of a JS-format embed or a host UI
	 * component) and its HTML is inlined. Fill children are interpreted in
	 * the ambient scope and passed as the default slot.
	 */
	components?: Record<string, ServerComponent>;

	/**
	 * Incoming slot renders, keyed by slot name: the fills a **parent**
	 * provides when this artifact is itself used as a component
	 * (cross-artifact, via `restrictedComponent`). A `<slot name="x">` region
	 * calls the incoming render with the slot props evaluated in this
	 * artifact's scope, falling back to its fallback children when absent —
	 * the same contract as the JS server build.
	 */
	slots?: Record<string, RestrictedSlotRender>;

	/**
	 * Host functions available to **data-layer** expressions only
	 * (requirement specs and `derive`): formatting and pure helpers. Template
	 * expressions never see these; their results ship in `$data` with the
	 * paint, so hydration can't re-run locale-sensitive formatting.
	 */
	formatters?: Record<string, (...args: unknown[]) => unknown>;

	/** Budgets for `derive` requirements (input rows, output rows, time). */
	deriveLimits?: DeriveLimits;

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
	/**
	 * The resolved data bag: the requirement values the program was rendered
	 * against (from `sources`, or passed pre-resolved via `data`), keyed by
	 * requirement name. Hosts need this to hydrate — the client build binds
	 * `$data` from props, per the paint-then-mount contract.
	 */
	data: Record<string, unknown>;
	/**
	 * The props the program was rendered with (embed defaults merged with the
	 * caller's), which the client build must also receive at hydration.
	 */
	props: Record<string, any>;
}

/**
 * A slot render for incoming fills, matching the server slot render
 * contract: called with the slot props the `<slot>` element evaluates
 * (e.g. per-row data), returning the fill's HTML.
 */
export type RestrictedSlotRender = (
	$slot?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => string | Promise<string>;
