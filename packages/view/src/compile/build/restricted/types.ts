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
	| { op: "get"; object: RestrictedExpr; key: string; optional?: boolean }
	| { op: "index"; object: RestrictedExpr; index: RestrictedExpr; optional?: boolean }
	/**
	 * Calls a host function by name (data-layer specs only — template
	 * expressions reject calls). The function must be provided by the host.
	 */
	| { op: "call"; name: string; args: RestrictedExpr[] }
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
	/**
	 * On component `class` props: the component's style-hash class. The
	 * interpreter passes the prop as `[value, scoped]`, matching the JS
	 * server build.
	 */
	scoped?: string;
}

/**
 * A dynamic attribute: the value is an expression evaluated at render time.
 *
 * - `format: "attr"` — set only when truthy, HTML-escaped (matches the JS
 *   server build's conditional attribute behavior).
 * - `format: "class"` — class value semantics (arrays/objects); `scoped` is
 *   the component's style-hash class to append.
 * - `format: "style"` — style value semantics (objects/arrays).
 *
 * On **component props**, `scoped` has the same meaning but the interpreter
 * passes the prop as `[value, scoped]` (an array), matching the JS builds'
 * scoped class prop contract.
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
	  }
	/** A host component usage: `<Card title={x}>children</Card>`. Props are
	 * passed raw (data, not HTML); `children` is the default fill. */
	| { t: "component"; name: string; props: RestrictedAttribute[]; fills: RestrictedFill[] }
	/** A `<slot name="…">fallback</slot>` element. Slot props (`item={row}`)
	 * are evaluated in the artifact's scope and passed to the incoming slot
	 * render; `children` is the fallback. `autoClose` lists the enclosing
	 * tags the HTML parser could auto-close — fill content starting with a
	 * tag that implies one of their ends is rejected at render time. */
	| {
			t: "slot";
			name: string;
			props: RestrictedAttribute[];
			children: RestrictedNode[];
			autoClose?: string[];
	  };

export interface RestrictedFill {
	/** Slot name; "_" is the default fill. */
	name: string;
	children: RestrictedNode[];
}

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
	/**
	 * Client state declarations extracted from the component's script:
	 * `let $state = $watch(<init>)` where `<init>` is a restricted
	 * expression over `$props`. SSR evaluates the initializers for the
	 * initial paint; the client build binds the real `$watch` state.
	 */
	state?: RestrictedStateInit[];
}

export interface RestrictedStateInit {
	name: string;
	init: RestrictedExpr;
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

export interface RestrictedRequirementKindContext {
	/** The name this requirement binds. */
	name: string;
	/** Names of requirements declared *before* this one (dependency order). */
	names: string[];
}

export interface RestrictedSpecEntry {
	key: string;
	expr: RestrictedExpr;
	/** Absolute source indices, for kind validators to report against. */
	keyStart: number;
	valueStart: number;
	valueEnd: number;
}

export type RestrictedRequirementKindValidator = (
	spec: RestrictedSpecEntry[],
	report: (message: string, start: number, end: number) => void,
	context?: RestrictedRequirementKindContext,
) => void;
