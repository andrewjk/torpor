import Builder from "../../utils/Builder";
import { skipStringOrComment } from "../../utils/codeScanner";
import containsIdentifier from "../../utils/containsIdentifier";
import type BuildStatus from "./BuildStatus";

/**
 * Returns the per-scope shadow bindings for every read-only loop variable in
 * scope (`const <name> = <dataPath>;`), one per line, or `""` when there are
 * none.
 *
 * The hook is that a `@for` body's user code is emitted inside a number of
 * compiler-generated scopes (`$run` effects, event handlers, control-node
 * callbacks, the row-create callback, …). Emitting the bindings at the top of
 * each scope makes the loop variable resolve lexically, so shadowing
 * (`arr.filter(child => child.ok)`) and no-space operator styles just work —
 * unlike the old textual substitution, which had no notion of scope.
 *
 * The binding is re-created on every invocation of the scope, so reads stay
 * live and tracked (in the proxy path, reading `<dataPath>` subscribes the
 * effect to the loop variable's signal).
 */
export default function forVarBindings(status: BuildStatus, source?: string): string {
	// When the caller knows the code that will run in the scope (e.g. a stashed
	// effect body), only bind the variables that code actually reads —
	// otherwise every scope would read every enclosing loop var.
	return collectBindings(
		status,
		(forVar) => source === undefined || containsIdentifier(source, forVar.name),
	);
}

/**
 * Like `forVarBindings`, but binds only the loop variables named in `names`.
 * Used for the row-create scope, where a separate scan decides which variables
 * the scope's directly-evaluated code reads.
 */
export function forVarBindingsFor(status: BuildStatus, names: ReadonlySet<string>): string {
	return collectBindings(status, (forVar) => names.has(forVar.name));
}

function collectBindings(
	status: BuildStatus,
	include: (forVar: BuildStatus["forVars"][number]) => boolean,
): string {
	const bound = new Set<string>();
	let result = "";
	// Iterate from the innermost loop outward, and emit each name at most once:
	// a nested loop that reuses an enclosing loop variable's name would
	// otherwise emit duplicate `const` declarations in the same scope. The
	// innermost binding wins, matching lexical shadowing.
	for (let i = status.forVars.length - 1; i >= 0; i--) {
		const forVar = status.forVars[i];
		if (!forVar.shadow || bound.has(forVar.name) || !include(forVar)) continue;
		bound.add(forVar.name);
		result = `const ${forVar.name} = ${forVar.path};\n` + result;
	}
	return result;
}

/**
 * Appends the shadow bindings for `status` to the builder, if there are any.
 * (A bare `b.append("")` would still emit a blank line.)
 */
export function appendForVarBindings(b: Builder, status: BuildStatus, source?: string): void {
	const bindings = forVarBindings(status, source);
	if (bindings !== "") {
		b.append(bindings);
	}
}

/** Appends the shadow bindings for the named loop variables, if there are any. */
export function appendForVarBindingsFor(
	b: Builder,
	status: BuildStatus,
	names: ReadonlySet<string>,
): void {
	const bindings = forVarBindingsFor(status, names);
	if (bindings !== "") {
		b.append(bindings);
	}
}

/**
 * Adds the shadow bindings *inside* a user-supplied function expression (an
 * event handler, transition factory, …), at invocation time, rather than
 * letting them be captured from the enclosing row scope.
 *
 * This matters because these callbacks are created once (when the row is
 * created) but invoked later — a binding captured from the row scope would
 * snapshot the loop variable and go stale after keyed reconciliation
 * replaces the row's data.
 *
 * When the expression is a plain arrow / function (the common case) the
 * bindings are injected into its body, so no extra closure is allocated. Any
 * other expression (a call returning a handler, a conditional, …) is wrapped
 * in a passthrough closure instead.
 */
export function injectForVarHandler(value: string, status: BuildStatus): string {
	const bindings = forVarBindings(status, value);
	if (bindings === "") {
		return value;
	}

	const arrow = findTopLevelArrow(value);
	if (arrow !== -1) {
		let body = arrow + 2;
		while (body < value.length && /\s/.test(value[body])) {
			body += 1;
		}
		if (value[body] === "{") {
			return `${value.substring(0, body + 1)}\n${bindings}${value.substring(body + 1)}`;
		}
		// Concise body: turn it into a block so the bindings can run first
		return `${value.substring(0, body)}{\n${bindings}return ${value.substring(body)}\n}`;
	}

	if (/\bfunction\b/.test(value)) {
		const brace = findBodyBrace(value);
		if (brace !== -1) {
			return `${value.substring(0, brace + 1)}\n${bindings}${value.substring(brace + 1)}`;
		}
	}

	// Fallback: create the bindings per invocation.
	return `function (...t_args) {\n${bindings}return (${value}).apply(this, t_args);\n}`;
}

/**
 * Returns the index of the first `=>` at the top level of `value` (not inside
 * a string/comment or nested parens/brackets/braces), or -1. Used to find the
 * outer arrow of a handler expression.
 */
function findTopLevelArrow(value: string): number {
	let depth = 0;
	let i = 0;
	while (i < value.length) {
		const skipped = skipStringOrComment(value, i);
		if (skipped !== -1) {
			i = skipped;
			continue;
		}
		const char = value[i];
		if (char === "(" || char === "[" || char === "{") {
			depth += 1;
		} else if (char === ")" || char === "]" || char === "}") {
			depth -= 1;
		} else if (char === "=" && value[i + 1] === ">" && depth === 0) {
			return i;
		}
		i += 1;
	}
	return -1;
}

/**
 * Injects the shadow bindings at the top of a `@function` declaration's body,
 * so a named function can reference enclosing loop variables and still see
 * their current values when it is called later.
 */
export function injectIntoFunctionBody(statement: string, status: BuildStatus): string {
	const bindings = forVarBindings(status, statement);
	if (bindings === "") {
		return statement;
	}
	const brace = findBodyBrace(statement);
	if (brace === -1) {
		return statement;
	}
	return `${statement.substring(0, brace + 1)}\n${bindings}${statement.substring(brace + 1)}`;
}

/**
 * Returns the index of the `{` that opens an expression's function body (the
 * first top-level brace, skipping parameter parens/brackets and
 * strings/comments), or -1 if there isn't one.
 */
function findBodyBrace(value: string): number {
	let depth = 0;
	let i = 0;
	while (i < value.length) {
		const skipped = skipStringOrComment(value, i);
		if (skipped !== -1) {
			i = skipped;
			continue;
		}
		const char = value[i];
		if (char === "(" || char === "[") {
			depth += 1;
		} else if (char === ")" || char === "]") {
			depth -= 1;
		} else if (char === "{" && depth === 0) {
			return i;
		}
		i += 1;
	}
	return -1;
}
