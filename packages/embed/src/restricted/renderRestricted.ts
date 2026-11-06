import type { RestrictedNode, RestrictedProgram } from "@torpor/view/compile";
import { t_attr, t_class, t_fmt, t_style } from "@torpor/view/ssr";
import embedProps from "../bridge/embedProps";
import checkVersion from "../checkVersion";
import { RUNTIME_VERSION } from "../generated/version";
import type EmbedArtifact from "../types/EmbedArtifact";
import evaluateExpr from "./evaluateExpr";
import resolveDerive from "./derive/resolveDerive";
import type { RenderRestrictedOptions, RestrictedRenderResult, RestrictedSource } from "./types";

/**
 * Hydration markers. The JS server build emits these as HTML "bogus comments"
 * (`<![]>`, `<!^0>`, ...), which the client's hydrate() walks; restricted
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
 * Renders a restricted artifact to HTML — **without evaluating
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
export default async function renderRestricted(
	artifact: EmbedArtifact,
	options?: RenderRestrictedOptions,
): Promise<RestrictedRenderResult> {
	if (artifact.format !== "restricted") {
		throw new Error(
			`Embed "${artifact.id}" is not a restricted artifact. Compile it with compileRestricted from "@torpor/embed/restricted".`,
		);
	}
	const program = artifact.server?.template;
	if (program === undefined) {
		throw new Error(
			`Embed "${artifact.id}" is missing its restricted template -- recompile it from its source.`,
		);
	}

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
		));

	const component =
		program.components.find((candidate) => candidate.default) ?? program.components[0];
	if (component === undefined) {
		throw new Error(`Embed "${artifact.id}" has no components to render.`);
	}

	const body = renderNodes(component.markup, { $props: props, $data: data });
	return { body, head: "", styles: artifact.styles };
}

async function resolveData(
	artifact: EmbedArtifact,
	program: RestrictedProgram,
	sources: Record<string, RestrictedSource> | undefined,
	formatters: Record<string, (...args: unknown[]) => unknown> | undefined,
	props: Record<string, any>,
	deriveLimits: import("./derive/resolveDerive").DeriveLimits | undefined,
): Promise<Record<string, unknown>> {
	const data: Record<string, unknown> = {};
	for (const requirement of program.requirements) {
		// `derive` is built in: it computes over earlier requirements' rows
		// with per-row scope, so its expressions are not pre-evaluated here.
		if (requirement.kind === "derive") {
			data[requirement.name] = resolveDerive(requirement, data, props, formatters, deriveLimits);
			continue;
		}

		const source = sources?.[requirement.kind];
		if (source === undefined) {
			throw new Error(
				`No source implementation for data requirement kind "${requirement.kind}" (needed by "${requirement.name}"). Pass sources: { "${requirement.kind}": … } to renderRestricted.`,
			);
		}
		const spec: Record<string, unknown> = {};
		for (const [key, expr] of Object.entries(requirement.spec)) {
			// Requirement specs may reference only $props (plus host
			// formatters); the evaluator reports anything else.
			spec[key] = evaluateExpr(expr, { $props: props }, formatters);
		}
		data[requirement.name] = await source(spec, { artifactId: artifact.id, props });
	}
	return data;
}

function renderNodes(nodes: RestrictedNode[], scope: Scope): string {
	let html = "";
	for (const node of nodes) html += renderNode(node, scope);
	return html;
}

function renderNode(node: RestrictedNode, scope: Scope): string {
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
			return `${open}${renderNodes(node.children, scope)}</${node.tag}>`;
		}

		case "if": {
			for (let index = 0; index < node.branches.length; index++) {
				const branch = node.branches[index];
				if (branch.test === undefined || evaluateExpr(branch.test, scope)) {
					return `${HYDRATION_START_COMMENT}<!^${index}>${renderNodes(branch.children, scope)}${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
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
				html += `<!^>${renderNodes(node.children, { ...scope, [node.item]: row })}`;
			}
			return `${html}${HYDRATION_END_COMMENT}${ANCHOR_COMMENT}`;
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
		} else if (value) {
			// Conditional attribute: only set when truthy (server behavior)
			parts.push(`${attribute.name}="${t_attr(value)}"`);
		} else {
			// The server build pushes an empty string for a falsy conditional
			// attribute; mirror it so byte output matches (including its
			// resulting spaces when joined)
			parts.push("");
		}
	}
	return parts.length === 0 ? "" : ` ${parts.join(" ")}`;
}
