import type Template from "../../../types/Template";
import type CompileError from "../../types/CompileError";
import type BuildOptions from "../../types/BuildOptions";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import buildStyles from "../client/buildStyles";
import { skipStringOrComment } from "../../utils/codeScanner";
import { AUTO_CLOSEABLE, autoCloseMessage, closesAncestor } from "../../utils/slotAutoClose";
import isControlNode from "../../utils/isControlNode";
import isComponentNode from "../../utils/isComponentNode";
import isSpecialNode from "../../utils/isSpecialNode";
import trimWhitespace from "../../utils/trimWhitespace";
import isTextNode from "../../utils/isTextNode";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import scanStateInitializers from "./scanState";
import parseExpression, { RestrictedSyntaxError } from "./parseExpression";
import type {
	RestrictedAttribute,
	RestrictedFill,
	RestrictedStateInit,
	RestrictedBuildResult,
	RestrictedComponent,
	RestrictedExpr,
	RestrictedNode,
} from "./types";

export interface RestrictedBuildOptions extends BuildOptions {}

interface Context {
	source: string;
	styleHash: string;
	preserveWhitespace: boolean;
	errors: CompileError[];
	report: (message: string, start: number, end?: number) => void;
	/** Roots a template expression may reference ($props, $data, state names). */
	allowedRefs: ReadonlySet<string>;
	/** Client state binding names declared in this component. */
	stateNames: string[];
	/** Loop variables in scope (innermost last), for ref validation. */
	loopVars: string[];
	/**
	 * The open element tags around the node being serialized (nearest last).
	 * Slot regions record the auto-closeable subset, so the interpreter can
	 * reject fill content the HTML parser would re-nest — see
	 * compile/utils/slotAutoClose.
	 */
	elementStack: string[];
}

/**
 * Builds a template into a serialized restricted program: the server-side
 * instruction tree interpreted by `renderRestricted` (no `eval`, so it is
 * legal on workerd).
 *
 * Must be called on a **freshly parsed** template: it maps text
 * interpolations through the parse-time source spans. Trimming whitespace
 * nodes here is safe (only whitespace-only nodes change), and matches the
 * JS build; `build()` calling `trimWhitespace` again is idempotent.
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

	for (let componentIndex = 0; componentIndex < template.components.length; componentIndex++) {
		const component = template.components[componentIndex];
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

		const state: RestrictedStateInit[] = [];
		const stateNames: string[] = [];
		const allowedRefs = new Set(["$props", "$data"]);
		const context: Context = {
			source,
			styleHash,
			preserveWhitespace: options?.preserveWhitespace === true,
			errors,
			report,
			allowedRefs,
			stateNames,
			loopVars: [],
			elementStack: [],
		};

		// Match the JS build exactly: trim/collapse whitespace-only text nodes.
		// Safe for interpolation spans: only whitespace-only nodes change, and
		// mixed text nodes keep their content (and therefore their spans).
		if (component.markup && options?.preserveWhitespace !== true) {
			trimWhitespace(component.markup);
		}

		// Scan this component's script chunks for `$watch` client state.
		// Initializers may only reference $props (the server evaluates them
		// per request); each scanned name becomes an allowed template root.
		const nextStart =
			template.components[componentIndex + 1]?.scriptStart ?? template.script.length;
		const componentChunks = template.script.slice(component.scriptStart ?? 0, nextStart);
		for (const scanned of scanStateInitializers(componentChunks)) {
			try {
				const init = parseExprAt(scanned.initSource, scanned.start, context);
				validateRefs(
					init,
					new Set(["$props"]),
					context,
					scanned.start,
					`state initializer "${scanned.name}"`,
					[],
				);
				state.push({ name: scanned.name, init });
				stateNames.push(scanned.name);
				allowedRefs.add(scanned.name);
			} catch (error) {
				if (error instanceof RestrictedSyntaxError) {
					report(error.message, error.start, error.end);
				} else {
					throw error;
				}
			}
		}

		const markup = component.markup ? serializeChildren(component.markup.children, context) : [];
		components.push({
			name: component.name,
			default: component.default,
			markup,
			state: state.length > 0 ? state : undefined,
		});
	}

	errors.sort((a, b) => a.startIndex - b.startIndex);
	// Requirements are not parsed from the template: they come from an app
	// manifest, which the host (e.g. compileRestricted) installs on the
	// program after the build.
	return { program: { requirements: [], components }, styles, errors };
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
	if (isComponentNode(node)) return serializeComponent(node, context);
	if (isSpecialNode(node)) {
		// `<slot>` parses as a special element; it renders its fallback children.
		if (node.tagName === "slot") {
			return serializeSlotElement(node, context);
		}
		context.report(
			`Special elements ("<${node.tagName}>") aren't supported in restricted mode yet.`,
			node.span.start,
			node.span.end,
		);
		return undefined;
	}
	return serializeElement(node as ElementNode, context);
}

/** Component attributes: static values and fully-reactive expressions only. */
function serializeComponentProps(node: ElementNode, context: Context): RestrictedAttribute[] {
	const attributes: RestrictedAttribute[] = [];
	// Scoped class props: when the usage matches the component's styles, the
	// class prop carries the style-hash class. The JS builds pass it as an
	// array (`["<value>", "torp-<hash>"]`); the `scoped` field tells the
	// interpreter to do the same.
	let needsClass = node.scopeStyles === true && context.styleHash !== "";

	for (const attribute of node.attributes) {
		const { name, value, fullyReactive, reactive } = attribute;
		if (name.startsWith("on") || name.startsWith(":on")) continue;
		if (name.startsWith("&")) {
			context.report(
				`Bindings ("${name}") aren't supported on components in restricted mode.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}
		if (name.startsWith(":")) {
			context.report(
				`Directives ("${name}") aren't supported on components in restricted mode.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}
		if (value === undefined) {
			attributes.push({ name });
			continue;
		}
		if (fullyReactive) {
			const expr = parseExprAt(value, attribute.span.start, context);
			if (name === "class" && needsClass) {
				attributes.push({ name, expr, scoped: `torp-${context.styleHash}` });
				needsClass = false;
			} else {
				attributes.push({ name, expr });
			}
		} else if (reactive) {
			context.report(
				`Mixed static/dynamic prop values aren't supported in restricted mode; compute the whole "${name}" value with an expression.`,
				attribute.span.start,
				attribute.span.end,
			);
		} else {
			const literal = trimQuotes(value);
			if (name === "class" && needsClass) {
				attributes.push({ name, value: literal, scoped: `torp-${context.styleHash}` });
				needsClass = false;
			} else {
				attributes.push({ name, value: literal });
			}
		}
	}
	// No trailing class prop here (unlike elements): the JS builds only scope
	// an explicit `class` attribute on component usages.
	return attributes;
}

/**
 * Component children are slot fills: loose children become the default fill
 * (`_`) and `<fill name="x">` children become named fills. Fill children may
 * read `$slot.<name>` for the slot props the host component passes; other
 * attributes on fills aren't supported.
 */
function serializeComponent(node: ElementNode, context: Context): RestrictedNode {
	const fills: RestrictedFill[] = [];
	const defaultFill: RestrictedNode[] = [];

	// All fill children (named fills and loose children, which become the
	// default fill) may read `$slot.<prop>` for the slot props the host
	// component passes per row.
	// Fill children may read `$slot.<prop>` for the slot props the host
	// component passes per row, and render inside the host's slot wrapper —
	// the consumer's own ancestors don't wrap them, so the element stack
	// resets.
	const fillContext: Context = {
		...context,
		allowedRefs: new Set([...context.allowedRefs, "$slot"]),
		elementStack: [],
	};

	for (const child of node.children) {
		if (isFill(child)) {
			const extra = child.attributes.filter((attribute) => attribute.name !== "name");
			if (extra.length > 0) {
				context.report(
					`Unexpected attributes on <fill>. Slot props are read as $slot.<name> inside the fill; only "name" is allowed here.`,
					child.span.start,
					child.span.end,
				);
				continue;
			}
			const nameAttribute = child.attributes.find((attribute) => attribute.name === "name");
			const name = nameAttribute ? trimQuotes(nameAttribute.value ?? "") || "_" : "_";

			fills.push({ name, children: serializeChildren(child.children, fillContext) });
		} else if (isTextNode(child) && child.content.trim() === "") {
			continue;
		} else {
			const serialized = serializeNode(child, fillContext);
			if (serialized !== undefined) defaultFill.push(serialized);
		}
	}

	if (defaultFill.length > 0) {
		fills.unshift({ name: "_", children: defaultFill });
	}

	return {
		t: "component",
		name: node.tagName,
		props: serializeComponentProps(node, context),
		fills,
	};
}

function isFill(node: TemplateNode): node is ElementNode {
	return isSpecialNode(node) && (node.tagName === "fill" || node.tagName === "filldef");
}

/** `<slot name="…">fallback</slot>` in a restricted template. Slot props
 * (`<slot item={row}/>` — anything but `name`) are evaluated in the
 * artifact's scope and passed to the incoming slot render, matching the JS
 * server build. */
function serializeSlotElement(node: ElementNode, context: Context): RestrictedNode {
	const nameAttribute = node.attributes.find((attribute) => attribute.name === "name");
	const name = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";

	const props: RestrictedAttribute[] = [];
	for (const attribute of node.attributes) {
		const { name: propName, value, fullyReactive, reactive } = attribute;
		if (propName === "name") continue;
		if (propName.startsWith("on") || propName.startsWith(":on")) continue;
		if (propName.startsWith("&")) {
			context.report(
				`Bindings ("${propName}") aren't supported on slot elements in restricted mode.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}
		if (propName.startsWith(":")) {
			context.report(
				`Directives ("${propName}") aren't supported on slot elements in restricted mode.`,
				attribute.span.start,
				attribute.span.end,
			);
			continue;
		}
		if (value === undefined) {
			props.push({ name: propName });
			continue;
		}
		if (fullyReactive) {
			props.push({ name: propName, expr: parseExprAt(value, attribute.span.start, context) });
		} else if (reactive) {
			context.report(
				`Mixed static/dynamic slot prop values aren't supported in restricted mode; compute the whole "${propName}" value with an expression.`,
				attribute.span.start,
				attribute.span.end,
			);
		} else {
			props.push({ name: propName, value: trimQuotes(value) });
		}
	}

	// The wrapper context the fill must not auto-close (nearest last). Only
	// auto-closeable tags matter — see compile/utils/slotAutoClose.
	const autoClose = context.elementStack.filter((tag) => AUTO_CLOSEABLE.has(tag));

	// Static fallback: reject a fallback whose first element would auto-close
	// the wrapper (positioned, so the author can fix it at save time).
	const fallbackTag = firstFallbackTag(node.children);
	if (fallbackTag !== undefined && closesAncestor(fallbackTag, context.elementStack)) {
		const ancestor = [...context.elementStack]
			.reverse()
			.find((ancestor) => closesAncestor(fallbackTag, [ancestor]));
		context.report(
			`Slot fallback starts with <${fallbackTag}>, which auto-closes the enclosing <${ancestor}>: ` +
				autoCloseMessage(fallbackTag, ancestor!),
			node.span.start,
			node.span.end,
		);
	}

	// The parser wraps slot children in filldef/fill special nodes; unwrap
	// them so the slot node carries its content directly.
	const children: RestrictedNode[] = [];
	for (const child of node.children) {
		if (isFill(child)) {
			children.push(...serializeChildren(child.children, context));
		} else {
			const serialized = serializeNode(child, context);
			if (serialized !== undefined) children.push(serialized);
		}
	}
	const slot: RestrictedNode = { t: "slot", name, props, children };
	if (autoClose.length > 0) {
		(slot as { autoClose?: string[] }).autoClose = autoClose;
	}
	return slot;
}

/** The tag of the first meaningful child (skipping whitespace text). */
function firstFallbackTag(children: TemplateNode[]): string | undefined {
	for (const child of children) {
		if (isFill(child)) return firstFallbackTag(child.children);
		if (isTextNode(child)) {
			if (child.content.trim() === "") continue;
			return undefined; // text first — no auto-closable root
		}
		if (child.type === "element") return (child as ElementNode).tagName;
		return undefined; // comment/control — not statically known
	}
	return undefined;
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

	if (!voidTags.includes(node.tagName)) {
		childContext.elementStack.push(node.tagName);
	}
	const children = voidTags.includes(node.tagName)
		? []
		: serializeChildren(node.children, childContext);
	if (!voidTags.includes(node.tagName)) {
		childContext.elementStack.pop();
	}

	return {
		t: "el",
		tag: node.tagName,
		attrs: serializeAttributes(node, context),
		children,
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
			// @key expressions can reference the loop variable
			const keyContext: Context = { ...context, loopVars: [...context.loopVars, item] };
			const equal = keyNode.statement.indexOf("=");
			const keySource = keyNode.statement
				.substring(equal + 1)
				.replace(/;\s*$/, "")
				.trim();
			key = parseExprAt(
				keySource,
				keyNode.span.start + keyNode.statement.indexOf(keySource),
				keyContext,
			);
		}

		const childContext: Context = { ...context, loopVars: [...context.loopVars, item] };
		return {
			t: "for",
			item,
			list,
			key,
			children: serializeChildren(
				forNode.children.filter((child) => !(isControlNode(child) && child.operation === "@key")),
				childContext,
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
		const expr = parseExpression(source, offset);
		validateRefs(expr, context.allowedRefs, context, offset, "template");
		return expr;
	} catch (error) {
		if (error instanceof RestrictedSyntaxError) {
			context.report(error.message, error.start, error.end);
			return { op: "lit", value: null };
		}
		throw error;
	}
}

/**
 * Validates that every identifier reference in a serialized expression is
 * available in the scope the interpreter will run it with -- so typos and
 * unknown roots are compile errors instead of render errors.
 */
function validateRefs(
	expr: RestrictedExpr,
	allowed: ReadonlySet<string>,
	context: Context,
	start: number,
	where: string,
	loopVars: ReadonlyArray<string> = context.loopVars,
): void {
	switch (expr.op) {
		case "ref": {
			if (!allowed.has(expr.name) && !loopVars.includes(expr.name)) {
				const available = [...allowed, ...loopVars].join(", ");
				context.report(
					`Unknown identifier "${expr.name}" in ${where}. Available: ${available || "(none)"}.`,
					start,
					start + expr.name.length + 2,
				);
			}
			return;
		}
		case "get":
			validateRefs(expr.object, allowed, context, start, where, loopVars);
			return;
		case "index":
			validateRefs(expr.object, allowed, context, start, where, loopVars);
			validateRefs(expr.index, allowed, context, start, where, loopVars);
			return;
		case "unary":
			validateRefs(expr.operand, allowed, context, start, where, loopVars);
			return;
		case "binary":
			validateRefs(expr.left, allowed, context, start, where, loopVars);
			validateRefs(expr.right, allowed, context, start, where, loopVars);
			return;
		case "ternary":
			validateRefs(expr.test, allowed, context, start, where, loopVars);
			validateRefs(expr.consequent, allowed, context, start, where, loopVars);
			validateRefs(expr.alternate, allowed, context, start, where, loopVars);
			return;
		case "array":
			for (const item of expr.items) validateRefs(item, allowed, context, start, where, loopVars);
			return;
		case "object":
			for (const value of Object.values(expr.entries)) {
				validateRefs(value, allowed, context, start, where, loopVars);
			}
			return;
	}
}
