import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import forLoopVarNames from "./forLoopVarNames";
import isControlNode from "./isControlNode";
import isTextNode from "./isTextNode";

/**
 * Returns the set of `forVars` that are written anywhere in `children`,
 * treating any write-target mention (direct assignment, property/index
 * assignment, `&`-binding) as a write.
 *
 * This is the conservative scan behind `isForBodyNoProxySafe`: anything
 * ambiguous must disable the no-proxy specialization, so a *property* write
 * (`row.name = …`) counts even though it doesn't replace the loop variable.
 */
export default function forVarsWrittenIn(children: TemplateNode[], forVars: string[]): Set<string> {
	return scan(
		children,
		forVars,
		// forVar or forVar.prop or forVar[key], optionally followed by an
		// assignment / compound-assignment / update operator.
		(escaped) =>
			`\\b${escaped}(?:\\.[a-zA-Z_$][\\w$]*|\\[[^\\]]+\\])?\\s*(?:=(?![=>])|[+\\-*/%&|^]=|\\+\\+|--)`,
	);
}

/**
 * Returns the set of `forVars` whose *binding* is written in `children` — i.e.
 * the loop variable itself is assigned (`row = …`, `row += …`, `row++`), bound
 * as a two-way target (`&value={row}`), or destructured into (`[row] = …`,
 * `{row} = …`).
 *
 * Loop variables are read-only (a `@for` extracts a copy of each element), so
 * `buildForNode` reports each name in this set as a compile error. A write to
 * a *property* (`row.name = …`) or *index* (`row[i] = …`) mutates the row
 * object through the shadowed reference and is not included.
 */
export function forVarsReassignedIn(children: TemplateNode[], forVars: string[]): Set<string> {
	return scan(
		children,
		forVars,
		// The bare identifier, but not a member/index write (`row.name =`,
		// `row[i] =`) and not a property of something else (`foo.row =`).
		(escaped) => `(?<![\\w$.])${escaped}\\s*(?:=(?![=>])|[+\\-*/%&|^]=|\\+\\+|--)`,
	);
}

function scan(
	children: TemplateNode[],
	forVars: string[],
	bareWritePattern: (escaped: string) => string,
): Set<string> {
	const found = new Set<string>();
	if (forVars.length === 0) return found;

	// Each collected string carries the loop-variable names declared by the
	// nested `@for` loops it lives under: a nested loop that redeclares a
	// name shadows the outer binding, so writes to it in that subtree belong
	// to the *inner* binding (reported by the inner loop's own scan). Without
	// this, an inner `@for (let item of B)` reusing an outer `item`'s name
	// would get its writes misattributed to the outer binding.
	const collected: { text: string; shadows: Set<string> }[] = [];
	for (const child of children) {
		collectExpressionStrings(child, collected, new Set());
	}

	for (const varName of forVars) {
		const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const writePattern = new RegExp(
			// `[forVar] =` or `{forVar} =` or `{forVar: …} =` — array / object
			// destructuring assignment targets. The trailing `=` is required so
			// we don't match `{forVar}` text interpolations or `arr[forVar]`
			// indexed reads. The leading boundary on `[` stops a *different*
			// array's index write (`labels[i] =`) from counting as an array
			// destructuring target for `i`.
			`(?<![\\w$.\\])\\)])\\[\\s*${escaped}\\s*\\]\\s*=(?![=>])|` +
				`(?<![\\w$.\\])\\)])\\{\\s*${escaped}\\s*(:[^}]+)?\\}\\s*=(?![=>])|` +
				bareWritePattern(escaped) +
				`|` +
				// prefix ++/--
				`(?<![\\w$.])(?:\\+\\+|--)\\s*${escaped}(?![\\w$])`,
		);
		for (const entry of collected) {
			if (entry.shadows.has(varName)) {
				continue;
			}
			if (writePattern.test(entry.text)) {
				found.add(varName);
				break;
			}
		}
	}
	return found;
}

function isElementLike(node: TemplateNode): node is ElementNode {
	return node.type === "element" || node.type === "component" || node.type === "special";
}

/**
 * Collects every expression-like string from the body, including attribute
 * values (with `&`-binding targets marked by a trailing `=`), text
 * interpolations, and control statements (recursing into nested controls).
 *
 * Nested `@for` loops are special: their own statement is skipped entirely
 * (its declarations and init/update expressions belong to the inner loop's
 * variables — a C-style header's `i++` is the inner loop's own bookkeeping,
 * not a write of an outer loop's variable), and every string beneath it is
 * recorded with the inner loop's variable names as shadowing it.
 */
function collectExpressionStrings(
	node: TemplateNode,
	out: { text: string; shadows: Set<string> }[],
	shadows: Set<string>,
): void {
	if (isTextNode(node)) {
		out.push({ text: node.content, shadows });
		return;
	}
	if (isElementLike(node)) {
		// Attribute names + values cover static attrs, reactive class/style
		// bindings, and event handlers (`onclick={() => select(row)}`).
		for (const attr of node.attributes) {
			if (attr.value !== undefined) {
				if (attr.name.startsWith("&")) {
					// Two-way bindings (`&value={i}`, `&checked={x}`,
					// `&group={g}`, `&foo={bar}` on components) emit
					// `${value} = …` assignment handlers, so the value
					// expression is a *write* target, not just a read.
					// Appending ` =` lets the regex flag any for-var that
					// appears in it as assigned.
					out.push({ text: `${attr.value} =`, shadows });
				} else {
					out.push({ text: attr.value, shadows });
				}
			}
			// Fully-reactive attribute spreads / dynamic attribute names are
			// emitted verbatim too — the value carries the expression.
			if (attr.fullyReactive && attr.name !== attr.value) {
				out.push({ text: attr.name, shadows });
			}
		}
		for (const child of node.children) {
			collectExpressionStrings(child, out, shadows);
		}
		return;
	}
	if (isControlNode(node)) {
		if (node.operation === "@for") {
			// A nested loop: its header belongs to its own variables
			// (declarations, init, update), and its loop variables shadow any
			// same-named outer variables for the entire subtree beneath it
			const nested = new Set(shadows);
			for (const name of forLoopVarNames(node.statement)) {
				nested.add(name);
			}
			for (const child of node.children) {
				collectExpressionStrings(child, out, nested);
			}
			return;
		}
		// `@key = row.id` is a *read* of `row.id`; we still scan the
		// statement because the key expression is the most common place a
		// for-var shows up, and reads are correctly ignored by the regex
		// (no assignment operator follows). For nested `@if`/`@for`/etc.,
		// the statement may also read for-vars.
		out.push({ text: node.statement, shadows });
		for (const child of node.children) {
			collectExpressionStrings(child, out, shadows);
		}
	}
}
