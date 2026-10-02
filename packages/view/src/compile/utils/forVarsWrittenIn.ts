import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
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

	const collected: string[] = [];
	for (const child of children) {
		collectExpressionStrings(child, collected);
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
		for (const text of collected) {
			if (writePattern.test(text)) {
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
 */
export function collectExpressionStrings(node: TemplateNode, out: string[]): void {
	if (isTextNode(node)) {
		out.push(node.content);
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
					out.push(`${attr.value} =`);
				} else {
					out.push(attr.value);
				}
			}
			// Fully-reactive attribute spreads / dynamic attribute names are
			// emitted verbatim too — the value carries the expression.
			if (attr.fullyReactive && attr.name !== attr.value) {
				out.push(attr.name);
			}
		}
		for (const child of node.children) {
			collectExpressionStrings(child, out);
		}
		return;
	}
	if (isControlNode(node)) {
		// `@key = row.id` is a *read* of `row.id`; we still scan the
		// statement because the key expression is the most common place a
		// for-var shows up, and reads are correctly ignored by the regex
		// (no assignment operator follows). For nested `@if`/`@for`/etc.,
		// the statement may also read for-vars.
		out.push(node.statement);
		for (const child of node.children) {
			collectExpressionStrings(child, out);
		}
	}
}
