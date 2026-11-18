import type { RestrictedNode, RestrictedProgram } from "@torpor/view/compile";
import type { ServerComponent } from "@torpor/view/ssr";
import { t_attr, t_attr_if, t_class, t_fmt, t_slot_guard, t_style } from "@torpor/view/ssr";
import embedProps from "../bridge/embedProps";
import checkVersion from "../checkVersion";
import { RUNTIME_VERSION } from "../generated/version";
import type EmbedArtifact from "../types/EmbedArtifact";
import evaluateExpr from "./evaluateExpr";
import resolveDerive from "./derive/resolveDerive";
import type {
	RenderArtifactOptions,
	ArtifactAuditEntry,
	ArtifactRenderResult,
	ArtifactSlotRender,
	ArtifactSource,
} from "./types";

/**
 * Hydration markers. The JS server build emits these as HTML "bogus comments"
 * (`<![]>`, `<!^0>`, ...), which the client's hydrate() walks; artifact
 * output emits the identical markers so hydration works unchanged.
 */
const ANCHOR_COMMENT = "<!>";
const HYDRATION_START_COMMENT = "<![>";
const HYDRATION_END_COMMENT = "<!]>";

/** The JS server build treats these as self-closing (see view's voidTags). */
const VOID_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

type Scope = Record<string, unknown>;

/**
 * Renders an artifact to HTML — **without evaluating
 * author-authored code**. The server build is an instruction tree; this
 * interpreter walks it against props and the resolved data bag, so it runs
 * anywhere JS runs, including workerd (where code generation from strings
 * is banned).
 *
 * Value formatting reuses the server build's own helpers (`t_fmt`,
 * `t_class`, `t_style`, `t_attr` from `@torpor/view/ssr`), so output matches
 * the Node SSR path.
 *
 * Requirements are resolved through the host's first-party `sources`
 * implementations (or passed pre-resolved via `data`). The template itself
 * can only read the resulting `$data` bag and `$props` — it cannot call,
 * construct, or assign anything.
 */
export default async function renderArtifact(
	artifact: EmbedArtifact,
	options?: RenderArtifactOptions,
): Promise<ArtifactRenderResult> {
	if (artifact.server?.template === undefined) {
		throw new Error(
			`Embed "${artifact.id}" is missing its server build -- recompile it from its source.`,
		);
	}
	const program = artifact.server.template;

	checkVersion(artifact.version, options?.runtimeVersion ?? RUNTIME_VERSION, {
		allowMismatch: options?.allowVersionMismatch,
	});

	const props = embedProps(artifact, options?.props ?? {}, options);
	const data =
		options?.data ??
		(await resolveData(
			artifact,
			program,
			options?.sources,
			options?.formatters,
			props,
			options?.deriveLimits,
			options?.onAudit,
		));

	const component =
		program.components.find((candidate) => candidate.default) ?? program.components[0];
	if (component === undefined) {
		throw new Error(`Embed "${artifact.id}" has no components to render.`);
	}

	if (component === undefined) {
		throw new Error(`Embed "${artifact.id}" has no components to render.`);
	}

	// Client state: initializers are artifact expressions over $props, so
	// the initial paint is computed without running author code. The client
	// build binds the real `$watch` state from the same props.
	const state: Record<string, unknown> = {};
	for (const init of component.state ?? []) {
		state[init.name] = evaluateExpr(init.init, { $props: props });
	}

	const components = options?.components;
	const renderContext: RenderContext = {
		scope: { $props: props, $data: data, ...state },
		components,
		slots: options?.slots,
		head: "",
	};
	const body = await renderNodes(component.markup, renderContext);
	// The renderer injects the *server* bridge into the props it renders with
	// (`$embed`), but the result is what the host passes to the CLIENT at
	// hydration — the client bridge is supplied there, and returning a
	// serialized/empty `$embed` would make the loader skip injecting the real
	// one (a `$embed` prop wins over `options.bridge`).
	const clientProps = { ...props };
	delete (clientProps as Record<string, unknown>).$embed;
	return { body, head: renderContext.head, styles: artifact.styles, data, props: clientProps };
}

async function resolveData(
	artifact: EmbedArtifact,
	program: RestrictedProgram,
	sources: Record<string, ArtifactSource> | undefined,
	formatters: Record<string, (...args: unknown[]) => unknown> | undefined,
	props: Record<string, any>,
	deriveLimits: import("./derive/resolveDerive").DeriveLimits | undefined,
	onAudit: ((entry: ArtifactAuditEntry) => void) | undefined,
): Promise<Record<string, unknown>> {
	const data: Record<string, unknown> = {};
	for (const requirement of program.requirements) {
		// `derive` is built in: it computes over earlier requirements' rows
		// with per-row scope, so its expressions are not pre-evaluated here.
		if (requirement.kind === "derive") {
			const started = nowMs();
			try {
				data[requirement.name] = resolveDerive(requirement, data, props, formatters, deriveLimits);
			} catch (error) {
				onAudit?.(
					auditEntry(
						artifact.id,
						requirement,
						auditSpec(requirement, props, formatters),
						started,
						false,
						error,
					),
				);
				throw error;
			}
			onAudit?.(
				auditEntry(
					artifact.id,
					requirement,
					auditSpec(requirement, props, formatters),
					started,
					true,
				),
			);
			continue;
		}

		const source = sources?.[requirement.kind];
		if (source === undefined) {
			throw new Error(
				`No source implementation for data requirement kind "${requirement.kind}" (needed by "${requirement.name}"). Pass sources: { "${requirement.kind}": … } to renderArtifact.`,
			);
		}
		const spec: Record<string, unknown> = {};
		for (const [key, expr] of Object.entries(requirement.spec)) {
			// Requirement specs may reference only $props (plus host
			// formatters); the evaluator reports anything else.
			spec[key] = evaluateExpr(expr, { $props: props }, formatters);
		}
		const started = nowMs();
		try {
			data[requirement.name] = await source(spec, { artifactId: artifact.id, props });
		} catch (error) {
			onAudit?.(auditEntry(artifact.id, requirement, spec, started, false, error));
			throw error;
		}
		onAudit?.(auditEntry(artifact.id, requirement, spec, started, true));
	}
	return data;
}

/** Wall-clock for audit entries (performance where available, Date otherwise). */
const nowMs = (): number =>
	typeof performance !== "undefined" && typeof performance.now === "function"
		? performance.now()
		: Date.now();

/**
 * The `derive` spec for an audit entry: its expressions run per row, so
 * only the fields that evaluate statically (`of`, `limit`, `order`,
 * aggregate flags) make it in — per-row expressions like `where` are
 * skipped rather than mis-evaluated without row scope.
 */
function auditSpec(
	requirement: RestrictedProgram["requirements"][number],
	props: Record<string, any>,
	formatters: Record<string, (...args: unknown[]) => unknown> | undefined,
): Record<string, unknown> {
	const spec: Record<string, unknown> = {};
	for (const [key, expr] of Object.entries(requirement.spec)) {
		let value: unknown;
		try {
			value = evaluateExpr(expr, { $props: props }, formatters);
		} catch {
			continue; // references row scope ($item/$index) — not a static field
		}
		if (
			value === null ||
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			spec[key] = value;
		}
	}
	return spec;
}

function auditEntry(
	artifactId: string,
	requirement: RestrictedProgram["requirements"][number],
	spec: Record<string, unknown>,
	started: number,
	ok: boolean,
	error?: unknown,
): ArtifactAuditEntry {
	return {
		artifactId,
		name: requirement.name,
		kind: requirement.kind,
		spec,
		durationMs: nowMs() - started,
		ok,
		error: error === undefined ? undefined : errorMessage(error),
	};
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (typeof error === "number" || typeof error === "boolean" || typeof error === "bigint") {
		return String(error);
	}
	// Objects (and anything else JSON can't represent) stringify or fall back
	try {
		return JSON.stringify(error) ?? "Unknown error";
	} catch {
		return "Unknown error";
	}
}

interface RenderContext {
	scope: Scope;
	components: Record<string, ServerComponent> | undefined;
	slots: Record<string, ArtifactSlotRender> | undefined;
	head: string;
}

async function renderNodes(nodes: RestrictedNode[], context: RenderContext): Promise<string> {
	let html = "";
	for (const node of nodes) html += await renderNode(node, context);
	return html;
}

async function renderNode(node: RestrictedNode, context: RenderContext): Promise<string> {
	const scope = context.scope;
	switch (node.t) {
		case "text": {
			let html = "";
			for (const part of node.parts) {
				html += typeof part === "string" ? part : t_fmt(evaluateExpr(part, scope));
			}
			return html;
		}

		case "el": {
			const open = `<${node.tag}${renderAttributes(node, scope)}>`;
			if (VOID_TAGS.has(node.tag)) return open;
			return `${open}${await renderNodes(node.children, context)}</${node.tag}>`;
		}

		case "component": {
			const component = context.components?.[node.name];
			if (component === undefined) {
				throw new Error(
					`No server component "${node.name}" was provided to renderArtifact (pass components: { "${node.name}": … }).`,
				);
			}
			const props: Record<string, unknown> = {};
			for (const attr of node.props) {
				if ("expr" in attr) {
					props[attr.name] = evaluateExpr(attr.expr, scope);
				} else {
					// Bare attributes are passed as `true`, matching the JS builds
					props[attr.name] = attr.value ?? true;
				}
				// Scoped class props go through as `[value, "torp-<hash>"]`,
				// matching the JS server build's contract
				if (attr.name === "class" && attr.scoped) {
					props[attr.name] = [props[attr.name], attr.scoped];
				}
			}
			const slots: Record<
				string,
				($slot?: Record<PropertyKey, any>, $context?: Record<PropertyKey, any>) => Promise<string>
			> = {};
			for (const fill of node.fills) {
				// The host component calls the slot render with the slot props
				// (e.g. per-row data); the fill reads them as $slot.<prop>.
				slots[fill.name] = async ($slot?: Record<PropertyKey, any>) => {
					const fillScope = { ...scope, $slot: $slot ?? {} };
					return renderNodes(fill.children, { ...context, scope: fillScope });
				};
			}
			const result = await component(props, undefined, slots);
			context.head += result.head;
			// The JS server build wraps component regions in hydration
			// markers (see buildServerComponentNode); match it exactly.
			return `${HYDRATION_START_COMMENT}${result.body}${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
		}

		case "slot": {
			// An incoming slot render (cross-artifact: this artifact is being
			// used as a component and the parent passed a fill) wins over the
			// fallback. Slot props (<slot item={row}/>) are evaluated in this
			// artifact's scope and passed to the render — the same contract
			// as the JS server build. The region keeps its hydration markers.
			const incoming = context.slots?.[node.name];
			let content: string;
			if (incoming !== undefined) {
				const slotProps: Record<string, unknown> = {};
				for (const attr of node.props) {
					slotProps[attr.name] =
						"expr" in attr ? evaluateExpr(attr.expr, scope) : (attr.value ?? true);
				}
				content = await incoming(Object.keys(slotProps).length > 0 ? slotProps : undefined);
			} else {
				content = await renderNodes(node.children, context);
			}
			// Reject fill content the HTML parser would re-nest (e.g. an <li>
			// fill inside <li><slot/></li>) — it shreds the slot region and
			// hydration can't adopt it
			if (node.autoClose !== undefined && node.autoClose.length > 0) {
				content = t_slot_guard(node.autoClose, content, node.name);
			}
			return `${HYDRATION_START_COMMENT}${content}${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
		}

		case "if": {
			for (let index = 0; index < node.branches.length; index++) {
				const branch = node.branches[index];
				if (branch.test === undefined || evaluateExpr(branch.test, scope)) {
					return `${HYDRATION_START_COMMENT}<!^${index}>${await renderNodes(branch.children, context)}${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
				}
			}
			// The JS server build injects a synthetic @else branch, so no match
			// renders that branch (index = declared branch count).
			return `${HYDRATION_START_COMMENT}<!^${node.branches.length}>${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
		}

		case "for": {
			const list = evaluateExpr(node.list, scope);
			let rows: unknown[] = [];
			if (Array.isArray(list)) {
				rows = list;
			} else if (
				list !== null &&
				list !== undefined &&
				typeof (list as Iterable<unknown>)[Symbol.iterator] === "function"
			) {
				rows = Array.from(list as Iterable<unknown>);
			} else if (list !== null && list !== undefined) {
				throw new Error(
					`@for list evaluated to a non-iterable ${typeof list}. Compute an array in the data layer.`,
				);
			}
			let html = HYDRATION_START_COMMENT;
			for (const row of rows) {
				// The JS server build emits one break marker per row
				html += `<!^>${await renderNodes(node.children, { ...context, scope: { ...scope, [node.item]: row } })}`;
			}
			html += HYDRATION_END_COMMENT + ANCHOR_COMMENT;
			return html;
		}
	}
}

function renderAttributes(node: Extract<RestrictedNode, { t: "el" }>, scope: Scope): string {
	const parts: string[] = [];
	for (const attribute of node.attrs) {
		// Static: boolean attribute or literal value (mirrors the server
		// build: only quotes are escaped in attribute text).
		if (!("expr" in attribute)) {
			parts.push(
				attribute.value === undefined
					? attribute.name
					: `${attribute.name}="${t_attr(attribute.value)}"`,
			);
			continue;
		}

		const value = evaluateExpr(attribute.expr, scope);
		if (attribute.format === "class") {
			// t_class returns the whole `class="…"` attribute, or "" when empty
			parts.push(t_class(value as never, attribute.scoped));
		} else if (attribute.format === "style") {
			parts.push(t_style(value as never));
		} else {
			// Conditional attribute: `t_attr_if` drops it for
			// null/undefined/false (matching the JS server build); an empty
			// string or 0 still renders
			parts.push(t_attr_if(attribute.name, value));
		}
	}
	return parts.length === 0 ? "" : ` ${parts.join(" ")}`;
}
