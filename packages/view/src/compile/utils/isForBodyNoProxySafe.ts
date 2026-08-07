import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import hasNestedControl from "./hasNestedControl";
import isControlNode from "./isControlNode";
import isTextNode from "./isTextNode";

/**
 * Returns true if the body of a `@for` loop never writes to any of its loop
 * variables (`forVars`) — neither directly (`row = ...`, `row.x = ...`,
 * `row[k] = ...`) nor via compound assignment (`+=`, `++`, etc.) — AND the
 * body contains no nested control statements (`@if`, `@for`, `@await`, …).
 *
 * When both hold, the compiler can emit a "no-proxy" `@for` specialization
 * that skips the per-item shallow `$watch` Proxy around the loop variable
 * bag: reads of `data.<forVar>` are plain property accesses (no proxyGet
 * trap), and the compiler-emitted `updateListItem` callback re-runs item
 * effects manually (via `t_rerun_region_effects`) when a forVar's reference
 * actually changes.
 *
 * The "no nested controls" constraint keeps the manual effect re-run sound:
 * without it, a nested `@if`'s effects would live on a descendant region
 * chained off the original item, but after keyed reconciliation that chain
 * is orphaned (the live item is a different object), so the re-run walk
 * couldn't find them. With no nested controls every row effect is on the
 * item itself, which is exactly what `t_rerun_region_effects` walks.
 *
 * Detection is intentionally conservative: a regex scan over every
 * expression-like string in the body (text interpolation, attribute values,
 * event handlers, control statements). Anything ambiguous falls back to the
 * proxy path. The for-statement itself (`for (let row of ...)`) is NOT
 * scanned — that's the loop header, not the body — so `for (...; i++)` style
 * loops with `i++` in the header are still eligible.
 */
export default function isForBodyNoProxySafe(
	forBodyChildren: TemplateNode[],
	forVars: string[],
): boolean {
	if (forVars.length === 0) return false;
	if (hasNestedControl(forBodyChildren)) return false;

	const collected: string[] = [];
	for (const child of forBodyChildren) {
		collectExpressionStrings(child, collected);
	}

	// One alternation per for-var; the alternation covers direct / property /
	// index writes plus prefix/postfix updates. `=(?![=>])` distinguishes `=`
	// from `==` / `===` / `=>`.
	//
	// The destructuring alternatives (`[forVar] =`, `{forVar} =`,
	// `{forVar: ...} =`) all require an `=` *after* the closing bracket /
	// brace: without that anchor they'd false-positive on torpor's own text
	// interpolation syntax (`<p>{forVar}</p>`) and on regular indexed-read
	// expressions (`arr[forVar]`).
	for (const varName of forVars) {
		const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const writePattern = new RegExp(
			// `[forVar] =` or `{forVar} =` or `{forVar: ...} =` — array / object
			// destructuring assignment targets. The trailing `=` is required so
			// we don't match `{forVar}` text interpolations or `arr[forVar]`
			// indexed reads.
			`\\[\\s*${escaped}\\s*\\]\\s*=(?![=>])|` +
				`\\{\\s*${escaped}\\s*(:[^}]+)?\\}\\s*=(?![=>])|` +
				// forVar or forVar.prop or forVar[key], optionally followed by
				// an assignment / compound-assignment / update operator
				`\\b${escaped}(?:\\.[a-zA-Z_$][\\w$]*|\\[[^\\]]+\\])?\\s*(?:=(?![=>])|[+\\-*/%&|^]=|\\+\\+|--)|` +
				// prefix ++/--
				`(?:\\+\\+|--)\\s*${escaped}\\b`,
		);
		for (const text of collected) {
			if (writePattern.test(text)) {
				return false;
			}
		}
	}
	return true;
}

function isElementLike(node: TemplateNode): node is ElementNode {
	return node.type === "element" || node.type === "component" || node.type === "special";
}

function collectExpressionStrings(node: TemplateNode, out: string[]): void {
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
