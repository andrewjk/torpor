/**
 * The restricted-mode instruction format.
 *
 * A restricted artifact's *server* build is a serialized program made of
 * these values: elements, text, control flow, attributes and expressions.
 * It is interpreted by trusted code (see `renderRestricted` in
 * `@torpor/embed`), so nothing here can execute author JavaScript. The
 * expression op set below is deliberately small and is the permanent
 * format API: additions are format decisions, not implementation details.
 */

/** A JSON-safe literal value. `undefined` is serialized as `null`. */
export type RestrictedLiteral = string | number | boolean | null;
export type RestrictedBinaryOperator =
	| "??"
	| "||"
	| "&&"
	| "=="
	| "!="
	| "==="
	| "!=="
	| "<"
	| "<="
	| ">"
	| ">="
	| "+"
	| "-"
	| "*"
	| "/"
	| "%";

export type RestrictedUnaryOperator = "!" | "-" | "+" | "typeof";

/**
 * A serialized expression over props, data and loop variables.
 *
 * There are deliberately **no calls**: template expressions are a pure
 * presentation layer (reads, literals, operators). Formatting and other
 * computation belongs in the data layer (`derive` requirements), where host
 * functions can run with budgets and the results are shipped to the client
 * with the paint -- so server and client can never disagree about a value.
 * Interpreters must never `eval` any part of this.
 */
export type RestrictedExpr =
	| { op: "lit"; value: RestrictedLiteral }
	| { op: "ref"; name: string }
	| { op: "get"; object: RestrictedExpr; key: string }
	| { op: "index"; object: RestrictedExpr; index: RestrictedExpr }
	| { op: "unary"; operator: RestrictedUnaryOperator; operand: RestrictedExpr }
	| {
			op: "binary";
			operator: RestrictedBinaryOperator;
			left: RestrictedExpr;
			right: RestrictedExpr;
	  }
	| { op: "ternary"; test: RestrictedExpr; consequent: RestrictedExpr; alternate: RestrictedExpr }
	| { op: "array"; items: RestrictedExpr[] }
	| { op: "object"; entries: Record<string, RestrictedExpr> };

/**
 * A static attribute: `name`, optionally with a literal value. A missing
 * value is a boolean attribute (`disabled`).
 */
export interface RestrictedStaticAttribute {
	name: string;
	value?: string;
}

/**
 * A dynamic attribute: the value is an expression evaluated at render time.
 *
 * - `format: "attr"` — set only when truthy, HTML-escaped (matches the JS
 *   server build's conditional attribute behavior).
 * - `format: "class"` — class value semantics (arrays/objects); `scoped` is
 *   the component's style-hash class to append.
 * - `format: "style"` — style value semantics (objects/arrays).
 */
export interface RestrictedDynamicAttribute {
	name: string;
	expr: RestrictedExpr;
	format: "attr" | "class" | "style";
	scoped?: string;
}

export type RestrictedAttribute = RestrictedStaticAttribute | RestrictedDynamicAttribute;

export type RestrictedNode =
	| { t: "el"; tag: string; attrs: RestrictedAttribute[]; children: RestrictedNode[] }
	| { t: "text"; parts: (string | RestrictedExpr)[] }
	| { t: "if"; branches: { test?: RestrictedExpr; children: RestrictedNode[] }[] }
	| {
			t: "for";
			item: string;
			list: RestrictedExpr;
			/** `@key` expression, when present */
			key?: RestrictedExpr;
			children: RestrictedNode[];
	  };

/** A resolved data declaration: kind + inert spec expressions. */
export interface RestrictedRequirement {
	/** The name the template reads as `$data.<name>`. */
	name: string;
	/** The source kind (`http`, a host-registered kind, …). */
	kind: string;
	spec: Record<string, RestrictedExpr>;
}

export interface RestrictedComponent {
	name?: string;
	default?: boolean;
	markup: RestrictedNode[];
}

export interface RestrictedProgram {
	/** File-level requirements, resolved by the host before interpreting. */
	requirements: RestrictedRequirement[];
	components: RestrictedComponent[];
}

export interface RestrictedBuildResult {
	program: RestrictedProgram;
	styles: {
		style: string;
		hash: string;
	}[];
	errors: import("../../types/CompileError").default[];
}

export type RestrictedRequirementKindValidator = (
	spec: import("./parseRequirementSpec").RestrictedSpecEntry[],
	report: (message: string, start: number, end: number) => void,
) => void;
