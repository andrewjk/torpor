import type Template from "../../../types/Template";
import type CompileError from "../../types/CompileError";
import type BuildOptions from "../../types/BuildOptions";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import buildStyles from "../client/buildStyles";
import { skipStringOrComment } from "../../utils/codeScanner";
import isControlNode from "../../utils/isControlNode";
import isTextNode from "../../utils/isTextNode";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import parseExpression, { RestrictedSyntaxError } from "./parseExpression";
import parseRequirementSpec from "./parseRequirementSpec";
import type {
	RestrictedAttribute,
	RestrictedBuildResult,
	RestrictedComponent,
	RestrictedExpr,
	RestrictedNode,
	RestrictedRequirement,
	RestrictedRequirementKindValidator,
} from "./types";

export interface RestrictedBuildOptions extends BuildOptions {
	/**
	 * The data requirement kinds available to this build, keyed by kind
	 * name. Unknown kinds are a compile error, so an admin importing an
	 * unsupported data source finds out at save time.
	 */
	requirementKinds?: Record<string, RestrictedRequirementKindValidator>;
}

interface Context {
	source: string;
	styleHash: string;
	preserveWhitespace: boolean;
	errors: CompileError[];
	report: (message: string, start: number, end?: number) => void;
}

/**
 * Builds a template into a serialized restricted program: the server-side
 * instruction tree interpreted by `renderRestricted` (no `eval`, so it is
 * legal on workerd).
 *
 * Must be called on a **freshly parsed** template: it maps text
 * interpolations through the parse-time source spans, and `build()` trims
 * whitespace nodes in place (which invalidates those spans).
 */
export default function buildRestricted(
	template: Template,
	options?: RestrictedBuildOptions,
): RestrictedBuildResult {
	const source = options?.source ?? "";
	const errors: CompileError[] = [];

	const report = (message: string, start: number, end: number = start): void => {
		errors.push(compileError(message, start, end, source));
	};

	const components: RestrictedComponent[] = [];
	const styles: { style: string; hash: string }[] = [];

	for (const component of template.components) {
		const styleHash = component.style?.hash ?? "";
		if (component.style) {
			styles.push({ style: buildStyles(component.style, styleHash), hash: styleHash });
		}
		if (component.head) {
			report("@head content isn't supported in restricted mode yet.", component.start ?? 0);
		}
		if (component.error) {
			report("@error blocks aren't supported in restricted mode yet.", component.start ?? 0);
		}
		const context: Context = {
			source,
			styleHash,
			preserveWhitespace: options?.preserveWhitespace === true,
			errors,
			report,
		};
		const markup = component.markup ? serializeChildren(component.markup.children, context) : [];
		components.push({ name: component.name, default: component.default, markup });
	}

	const requirements: RestrictedRequirement[] = [];
	const names = new Set<string>();
	for (const declaration of template.requirements ?? []) {
		if (names.has(declaration.name)) {
			report(
				`Duplicate data requirement name "${declaration.name}".`,
				declaration.span.start,
				declaration.span.end,
			);
			continue;
		}
		names.add(declaration.name);
		try {
			const entries = parseRequirementSpec(declaration.spec, declaration.specStart);
			const validator = options?.requirementKinds?.[declaration.kind];
			if (!validator) {
				report(
					`Unknown data requirement kind "${declaration.kind}". Enable it in the compiler's requirementKinds (or have the host provide it as a first-party kind).`,
					declaration.span.start,
					declaration.span.end,
				);
				continue;
			}
			validator(entries, report);
			const spec: Record<string, RestrictedExpr> = {};
			for (const entry of entries) spec[entry.key] = entry.expr;
			requirements.push({ name: declaration.name, kind: declaration.kind, spec });
		} catch (error) {
			if (error instanceof RestrictedSyntaxError) {
				report(error.message, error.start, error.end);
			} else {
				throw error;
			}
		}
	}

	errors.sort((a, b) => a.startIndex - b.startIndex);
	return { program: { requirements, components }, styles, errors };
}

function compileError(message: string, start: number, end: number, source: string): CompileError {
	let startLine = 0;
	let lastLineStart = 0;
	let i = 0;
	for (; i < start && i < source.length; i++) {
		if (source[i] === "\n") {
			startLine += 1;
			lastLineStart = i + 1;
		}
	}
	const startChar = start - lastLineStart;
	let endLine = startLine;
	for (; i < end && i < source.length; i++) {
		if (source[i] === "\n") {
			endLine += 1;
			lastLineStart = i + 1;
		}
	}
	return {
		message,
		startIndex: start,
		startLine,
		startChar,
		endIndex: end,
		endLine,
		endChar: end - lastLineStart,
	};
}

function serializeChildren(nodes: TemplateNode[], context: Context): RestrictedNode[] {
	const result: RestrictedNode[] = [];
	for (const node of nodes) {
		const serialized = serializeNode(node, context);
		if (serialized !== undefined) result.push(serialized);
	}
	return result;
}

function serializeNode(node: TemplateNode, context: Context): RestrictedNode | undefined {
	if (isTextNode(node)) return serializeText(node, context);
	if (isControlNode(node)) return serializeControl(node, context);
	if (node.type === "comment") {
		// Comments don't affect rendered content; dropped in restricted mode.
		return undefined;
	}
	return serializeElement(node as ElementNode, context);
}

function serializeElement(node: ElementNode, context: Context): RestrictedNode | undefined {
	if (node.type === "component") {
		context.report(
			`Nested components ("<${node.tagName}>") aren't supported in restricted mode yet. Inline the markup, or render it client-side.`,
			node.span.start,
			node.span.end,
		);
		return undefined;
	}
	if (node.type === "special") {
		context.report(
			`Special elements ("<${node.tagName}>") aren't supported in restricted mode yet.`,
			node.span.start,
			node.span.end,
		);
		return undefined;
	}

	const childContext =
		node.tagName === "pre" || node.tagName === "code"
			? { ...context, preserveWhitespace: true }
			: context;

	return {
		t: "el",
		tag: node.tagName,
		attrs: serializeAttributes(node, context),
		children: voidTags.includes(node.tagName) ? [] : serializeChildren(node.children, childContext),
	};
}

function serializeAttributes(node: ElementNode, context: Context): RestrictedAttribute[] {
	const attributes: RestrictedAttribute[] = [];
	let needsClass = node.scopeStyles === true && context.styleHash !== "";

	for (const attribute of node.attributes) {
		const { name, value, fullyReactive, reactive } = attribute;

		if (name === "self" && node.tagName === "@element") continue;
		if (name === "&ref") continue;
		if (name.startsWith("on") || name.startsWith(":on")) continue;
		if (name.startsWith("transition")) continue;
		if (name.startsWith("&")) {
			context.report(
				`Form bindings ("${name}") aren't supported in restricted mode yet; use ${name.substring(1)}={…} instead.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}
		if (name.startsWith(":")) {
			context.report(
				`Directives ("${name}") aren't supported in restricted mode yet.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}

		if (value === undefined) {
			if (name === "class" && needsClass) {
				attributes.push({ name: "class", value: `torp-${context.styleHash}` });
				needsClass = false;
			} else {
				attributes.push({ name });
			}
			continue;
		}

		if (fullyReactive) {
			const expr = parseExprAt(value, attribute.span.start, context);
			if (name === "class") {
				attributes.push({
					name,
					expr,
					format: "class",
					scoped: needsClass ? `torp-${context.styleHash}` : undefined,
				});
				needsClass = false;
			} else if (name === "style") {
				attributes.push({ name, expr, format: "style" });
			} else {
				attributes.push({ name, expr, format: "attr" });
			}
		} else if (reactive) {
			context.report(
				`Mixed static/dynamic attribute values aren't supported in restricted mode; compute the whole "${name}" value with an expression.`,
				attribute.span.start,
				attribute.span.end,
			);
		} else {
			let literal = trimQuotes(value);
			if (name === "class" && needsClass) {
				literal = literal ? `${literal} torp-${context.styleHash}` : `torp-${context.styleHash}`;
				needsClass = false;
			}
			attributes.push({ name, value: literal });
		}
	}

	if (needsClass) attributes.push({ name: "class", value: `torp-${context.styleHash}` });
	return attributes;
}

function serializeText(node: TextNode, context: Context): RestrictedNode | undefined {
	const parts: (string | RestrictedExpr)[] = [];

	const pushLiteral = (literal: string): void => {
		const collapsed = context.preserveWhitespace ? literal : literal.replace(/\s+/g, " ");
		if (collapsed.length === 0) return;
		const last = parts[parts.length - 1];
		if (typeof last === "string") parts[parts.length - 1] = last + collapsed;
		else parts.push(collapsed);
	};

	if (node.spans.length === 0 || node.start === undefined) {
		pushLiteral(node.content);
	} else {
		const start = node.start;
		let cursor = 0;
		for (const span of node.spans) {
			const literalEnd = span.start - start - 1;
			pushLiteral(node.content.substring(cursor, literalEnd));
			parts.push(parseExprAt(context.source.substring(span.start, span.end), span.start, context));
			cursor = span.end - start + 1;
		}
		pushLiteral(node.content.substring(cursor));
	}

	if (parts.length === 0) return undefined;
	return { t: "text", parts };
}

function serializeControl(node: ControlNode, context: Context): RestrictedNode | undefined {
	if (node.operation === "@if group") {
		const branches = node.children.filter(isControlNode).map((branch) => {
			if (branch.operation === "@else") {
				return { children: serializeChildren(branch.children, context) };
			}
			const statement = branch.statement;
			const open = statement.indexOf("(");
			if (open === -1) {
				context.report(
					`Malformed ${branch.operation} statement.`,
					branch.span.start,
					branch.span.end,
				);
				return { test: { op: "lit", value: null } as RestrictedExpr, children: [] };
			}
			const { inner, innerStart } = extractBalanced(statement, open, branch, context);
			return {
				test: parseExprAt(inner, branch.span.start + innerStart, context),
				children: serializeChildren(branch.children, context),
			};
		});
		return { t: "if", branches };
	}

	if (node.operation === "@for group") {
		const forNode = node.children.find(
			(child): child is ControlNode => isControlNode(child) && child.operation === "@for",
		);
		if (!forNode) {
			context.report("Malformed @for block.", node.span.start, node.span.end);
			return undefined;
		}
		const open = forNode.statement.indexOf("(");
		if (open === -1) {
			context.report("Malformed @for statement.", forNode.span.start, forNode.span.end);
			return undefined;
		}
		const { inner, innerStart } = extractBalanced(forNode.statement, open, forNode, context);
		const match = /^\s*(?:(?:let|const|var)\s+)?([A-Za-z_$][\w$]*)\s+(of|in)\s+([\s\S]+)$/.exec(
			inner,
		);
		if (!match) {
			context.report(
				"Only `@for (item of list)` is supported in restricted mode yet (no destructuring, index variables, or C-style loops).",
				forNode.span.start,
				forNode.span.end,
			);
			return undefined;
		}
		if (match[2] === "in") {
			context.report(
				"`in` loops aren't supported in restricted mode; use `of`.",
				forNode.span.start,
				forNode.span.end,
			);
			return undefined;
		}

		const item = match[1];
		const listSource = match[3].trim();
		const listIndex = inner.lastIndexOf(listSource);
		const list = parseExprAt(listSource, forNode.span.start + innerStart + listIndex, context);

		const keyNode = forNode.children.find(
			(child): child is ControlNode => isControlNode(child) && child.operation === "@key",
		);
		let key: RestrictedExpr | undefined;
		if (keyNode) {
			const equal = keyNode.statement.indexOf("=");
			const keySource = keyNode.statement
				.substring(equal + 1)
				.replace(/;\s*$/, "")
				.trim();
			key = parseExprAt(
				keySource,
				keyNode.span.start + keyNode.statement.indexOf(keySource),
				context,
			);
		}

		return {
			t: "for",
			item,
			list,
			key,
			children: serializeChildren(
				forNode.children.filter((child) => !(isControlNode(child) && child.operation === "@key")),
				context,
			),
		};
	}

	context.report(
		`"${node.operation}" isn't supported in restricted mode yet.`,
		controlSpan(node).start,
		controlSpan(node).end,
	);
	return undefined;
}

/** Group nodes (`@if group`, `@html group`…) carry zero spans; their first
 * control child has the real source span. */
function controlSpan(node: ControlNode): { start: number; end: number } {
	if (node.span.start === 0 && node.span.end === 0) {
		const child = node.children.find(isControlNode);
		if (child) return child.span;
	}
	return node.span;
}

/**
 * Extracts the text between `source[open]` and its matching `)`, skipping
 * strings and comments. `innerStart` is the index just after the `(`.
 */
function extractBalanced(
	source: string,
	open: number,
	node: ControlNode,
	context: Context,
): { inner: string; innerStart: number } {
	let level = 0;
	for (let i = open; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped - 1;
			continue;
		}
		if (source[i] === "(") {
			level += 1;
		} else if (source[i] === ")") {
			level -= 1;
			if (level === 0) {
				return { inner: source.substring(open + 1, i), innerStart: open + 1 };
			}
		}
	}
	context.report("Unbalanced parentheses in a control statement.", node.span.start, node.span.end);
	return { inner: source.substring(open + 1), innerStart: open + 1 };
}

function parseExprAt(source: string, offset: number, context: Context): RestrictedExpr {
	try {
		return parseExpression(source, offset);
	} catch (error) {
		if (error instanceof RestrictedSyntaxError) {
			context.report(error.message, error.start, error.end);
			return { op: "lit", value: null };
		}
		throw error;
	}
}
