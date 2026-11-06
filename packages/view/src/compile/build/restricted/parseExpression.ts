import type { RestrictedBinaryOperator, RestrictedExpr } from "./types";

/**
 * Parses a restricted template expression into the serialized op set.
 *
 * This is intentionally a small, hand-written parser rather than a general
 * JS parser: the grammar *is* the restricted op set (the permanent format
 * API), so anything outside it is rejected with a positioned error instead
 * of being parsed and then policed. Regex-based tokenizing was rejected --
 * operators inside string literals and operator precedence make it
 * unsound.
 *
 * Supported: literals, identifiers (props/data/loop variables), property
 * and index access, unary `! - + typeof`, arithmetic/comparison/logic
 * (`* / %`, `+ -`, `< <= > >=`, `== != === !==`, `&&`, `||`, `??`),
 * ternaries, and array/object literals.
 *
 * Deliberately not supported (each gets a targeted error): calls (format
 * in `derive` instead), authored functions/arrows, `new`, `await`,
 * assignments and updates, optional chaining, template literals, spread.
 */

export class RestrictedSyntaxError extends Error {
	/** Absolute index (including the parser's offset) where the error starts. */
	start: number;
	/** Absolute index where the error ends. */
	end: number;

	constructor(message: string, start: number, end: number) {
		super(message);
		this.name = "RestrictedSyntaxError";
		this.start = start;
		this.end = end;
	}
}

interface Token {
	type: "num" | "str" | "ident" | "punct" | "eof";
	value: string;
	start: number;
	end: number;
}

const MULTI_PUNCT = [
	"===",
	"!==",
	"&&=",
	"||=",
	"??=",
	"...",
	"=>",
	"?.",
	"==",
	"!=",
	"<=",
	">=",
	"&&",
	"||",
	"??",
	"++",
	"--",
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
];
const SINGLE_PUNCT = new Set("+-*/%!<>=?:.,()[]{}".split(""));
const ASSIGNMENT = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&&=", "||=", "??="]);

/** Binary operators from lowest to highest precedence. */
const BINARY_LEVELS: ReadonlyArray<ReadonlyArray<RestrictedBinaryOperator>> = [
	["??"],
	["||"],
	["&&"],
	["==", "!=", "===", "!=="],
	["<", "<=", ">", ">="],
	["+", "-"],
	["*", "/", "%"],
];

const UNARY_PUNCT = new Set(["!", "-", "+"]);

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const RESERVED: Record<string, string> = {
	new: "`new` isn't supported in restricted expressions.",
	await:
		"`await` isn't supported in restricted expressions; SSR data comes from `data` requirements.",
	this: "`this` isn't supported in restricted expressions.",
	super: "`super` isn't supported in restricted expressions.",
	function: "Function expressions aren't supported in restricted expressions.",
	class: "Classes aren't supported in restricted expressions.",
	yield: "`yield` isn't supported in restricted expressions.",
	delete: "`delete` isn't supported in restricted expressions.",
	void: "`void` isn't supported in restricted expressions.",
	in: "`in` isn't supported in restricted expressions.",
	instanceof: "`instanceof` isn't supported in restricted expressions.",
	const: "Declarations aren't supported in restricted expressions.",
	let: "Declarations aren't supported in restricted expressions.",
	var: "Declarations aren't supported in restricted expressions.",
	return: "`return` isn't supported in restricted expressions.",
};

const CALLS_UNSUPPORTED =
	"Function calls aren't supported in restricted template expressions. Compute formatted/derived values in the data layer instead, e.g. `data view from derive { of: …, map: { formattedX: format($item.x) } }`, or have the host shape the requirement's result.";

const ARROWS_UNSUPPORTED =
	"Arrow functions aren't supported in restricted expressions. Move the logic into a `derive` requirement, a host formatter, or the client build.";

function tokenize(source: string, offset: number): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	const error = (message: string, start: number, end: number): never => {
		throw new RestrictedSyntaxError(message, offset + start, offset + end);
	};

	while (i < source.length) {
		const char = source[i];

		if (char === " " || char === "\t" || char === "\n" || char === "\r") {
			i += 1;
			continue;
		}

		const start = i;

		// Numbers
		if (char >= "0" && char <= "9") {
			i += 1;
			while (i < source.length && source[i] >= "0" && source[i] <= "9") i += 1;
			if (source[i] === "." && source[i + 1] >= "0" && source[i + 1] <= "9") {
				i += 1;
				while (i < source.length && source[i] >= "0" && source[i] <= "9") i += 1;
			}
			if (source[i] === "e" || source[i] === "E") {
				const exponentStart = i;
				i += 1;
				if (source[i] === "+" || source[i] === "-") i += 1;
				if (source[i] >= "0" && source[i] <= "9") {
					while (i < source.length && source[i] >= "0" && source[i] <= "9") i += 1;
				} else {
					i = exponentStart;
				}
			}
			tokens.push({
				type: "num",
				value: source.substring(start, i),
				start: offset + start,
				end: offset + i,
			});
			continue;
		}

		// Strings
		if (char === '"' || char === "'") {
			const quote = char;
			i += 1;
			let value = "";
			let closed = false;
			while (i < source.length) {
				const current = source[i];
				if (current === quote) {
					i += 1;
					closed = true;
					break;
				}
				if (current === "\n") break;
				if (current === "\\") {
					i += 1;
					const escape = source[i];
					if (escape === undefined) break;
					switch (escape) {
						case "n":
							value += "\n";
							break;
						case "r":
							value += "\r";
							break;
						case "t":
							value += "\t";
							break;
						case "b":
							value += "\b";
							break;
						case "f":
							value += "\f";
							break;
						case "v":
							value += "\v";
							break;
						case "0":
							value += "\0";
							break;
						case "\\":
							value += "\\";
							break;
						case "'":
							value += "'";
							break;
						case '"':
							value += '"';
							break;
						case "u": {
							const hex = source.substring(i + 1, i + 5);
							if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
								error("Invalid unicode escape sequence", i - 1, i + 2);
							}
							value += String.fromCharCode(parseInt(hex, 16));
							i += 4;
							break;
						}
						default:
							error(`Invalid escape sequence "\\${escape}"`, i - 1, i + 1);
					}
					i += 1;
					continue;
				}
				value += current;
				i += 1;
			}
			if (!closed) error("Unterminated string literal", start, i);
			tokens.push({ type: "str", value, start: offset + start, end: offset + i });
			continue;
		}

		// Template literals: rejected explicitly (they are not in the op set)
		if (char === "`") {
			error(
				"Template literals aren't supported in restricted expressions; use string concatenation with `+`.",
				start,
				start + 1,
			);
		}

		// Identifiers
		if (char === "$" || char === "_" || /[A-Za-z]/.test(char)) {
			i += 1;
			while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i += 1;
			tokens.push({
				type: "ident",
				value: source.substring(start, i),
				start: offset + start,
				end: offset + i,
			});
			continue;
		}

		// Punctuation (longest match first)
		let matched: string | undefined;
		for (const punct of MULTI_PUNCT) {
			if (source.startsWith(punct, i)) {
				matched = punct;
				break;
			}
		}
		if (matched === undefined && SINGLE_PUNCT.has(char)) matched = char;
		if (matched !== undefined) {
			i += matched.length;
			tokens.push({ type: "punct", value: matched, start: offset + start, end: offset + i });
			continue;
		}

		error(`Unexpected character "${char}"`, start, start + 1);
	}

	tokens.push({
		type: "eof",
		value: "",
		start: offset + source.length,
		end: offset + source.length,
	});
	return tokens;
}

export interface ParsedExpressionPrefix {
	expression: RestrictedExpr;
	/** Absolute source index where the expression ends (the next token). */
	end: number;
}

export interface ParseExpressionOptions {
	/**
	 * Allow calls to named host functions (`format($item.due)`). Data-layer
	 * specs (requirement values, derive expressions) allow them; template
	 * expressions do not, so rendering stays pure.
	 */
	allowCalls?: boolean;
}

/**
 * Parses one restricted expression.
 *
 * @param source The expression source text
 * @param offset The source index the expression starts at, so errors point
 *   into the original file
 */
export default function parseExpression(
	source: string,
	offset = 0,
	options?: ParseExpressionOptions,
): RestrictedExpr {
	return parseCore(source, offset, false, options).expression;
}

/**
 * Parses an expression that is followed by more text (e.g. a requirement
 * spec's `,` or the end of the spec). Returns where the expression ended so
 * callers can continue scanning.
 */
export function parseExpressionPrefix(
	source: string,
	offset = 0,
	options?: ParseExpressionOptions,
): ParsedExpressionPrefix {
	return parseCore(source, offset, true, options);
}

function parseCore(
	source: string,
	offset: number,
	allowTrailing: boolean,
	options?: ParseExpressionOptions,
): ParsedExpressionPrefix {
	const allowCalls = options?.allowCalls === true;
	const tokens = tokenize(source, offset);
	let index = 0;

	const peek = (): Token => tokens[index];
	const next = (): Token => tokens[index++];

	const error: (message: string, token?: Token) => never = (message, token = peek()) => {
		throw new RestrictedSyntaxError(message, token.start, token.end);
	};

	const expect = (value: string): Token => {
		const token = next();
		if (token.type === "eof" || token.value !== value) {
			error(
				`Expected "${value}"${token.type === "eof" ? " but reached the end of the expression" : ` but found "${token.value}"`}`,
				token,
			);
		}
		return token;
	};

	const isPunct = (value: string): boolean => peek().type === "punct" && peek().value === value;

	function parseTernary(): RestrictedExpr {
		const test = parseBinary(0);
		if (!isPunct("?")) return test;
		next();
		const consequent = parseTernary();
		expect(":");
		const alternate = parseTernary();
		return { op: "ternary", test, consequent, alternate };
	}

	function parseBinary(level: number): RestrictedExpr {
		if (level >= BINARY_LEVELS.length) return parseUnary();
		const operators = BINARY_LEVELS[level];
		let left = parseBinary(level + 1);
		while (peek().type === "punct" && (operators as readonly string[]).includes(peek().value)) {
			const operator = next().value as RestrictedBinaryOperator;
			const right = parseBinary(level + 1);
			left = { op: "binary", operator, left, right };
		}
		return left;
	}

	function parseUnary(): RestrictedExpr {
		const token = peek();
		if (
			(token.type === "punct" && UNARY_PUNCT.has(token.value)) ||
			(token.type === "ident" && token.value === "typeof")
		) {
			next();
			const operand = parseUnary();
			return { op: "unary", operator: token.value as "!" | "-" | "+" | "typeof", operand };
		}
		return parsePostfix();
	}

	function parsePostfix(): RestrictedExpr {
		let expression = parsePrimary();
		while (true) {
			const token = peek();
			if (token.type !== "punct") return expression;

			if (token.value === "." || token.value === "?.") {
				const optional = token.value === "?.";
				next();
				// `a?.[b]` tokenizes as "?." then "["
				if (optional && peek().type === "punct" && peek().value === "[") {
					next();
					const indexExpr = parseTernary();
					expect("]");
					expression = {
						op: "index",
						object: expression,
						index: indexExpr,
						optional: true,
					};
					continue;
				}
				const key = next();
				if (key.type !== "ident") {
					error(`Expected a property name after "${token.value}"`, key);
				}
				if (DANGEROUS_KEYS.has(key.value)) {
					error(
						`Dangerous property name "${key.value}" isn't allowed in restricted expressions`,
						key,
					);
				}
				expression = optional
					? { op: "get", object: expression, key: key.value, optional: true }
					: { op: "get", object: expression, key: key.value };
				continue;
			}

			if (token.value === "[") {
				next();
				const indexExpr = parseTernary();
				expect("]");
				expression = { op: "index", object: expression, index: indexExpr };
				continue;
			}

			if (token.value === "(") {
				if (!allowCalls) error(CALLS_UNSUPPORTED, token);
				if (expression.op !== "ref") {
					error(
						"Only named host functions can be called; method calls (a.b()) aren't supported in restricted expressions.",
						token,
					);
				}
				next();
				const args: RestrictedExpr[] = [];
				while (!isPunct(")")) {
					if (peek().type === "eof") expect(")");
					args.push(parseTernary());
					if (isPunct(",")) next();
				}
				expect(")");
				expression = { op: "call", name: expression.name, args };
				continue;
			}

			if (token.value === "++" || token.value === "--") {
				error("Updates (`++`/`--`) aren't supported in restricted expressions.", token);
			}

			return expression;
		}
	}

	function parsePrimary(): RestrictedExpr {
		const token = next();
		switch (token.type) {
			case "num":
				return { op: "lit", value: Number(token.value) };
			case "str":
				return { op: "lit", value: token.value };
			case "ident": {
				const name = token.value;
				if (name === "true") return { op: "lit", value: true };
				if (name === "false") return { op: "lit", value: false };
				if (name === "null" || name === "undefined") return { op: "lit", value: null };
				const reserved = RESERVED[name];
				if (reserved !== undefined) error(reserved, token);
				return { op: "ref", name };
			}
			case "punct": {
				if (token.value === "(") {
					const expression = parseTernary();
					expect(")");
					return expression;
				}
				if (token.value === "[") {
					const items: RestrictedExpr[] = [];
					while (!isPunct("]")) {
						if (peek().type === "eof") expect("]");
						if (isPunct(",")) {
							next();
							continue;
						}
						items.push(parseTernary());
						if (isPunct(",")) next();
					}
					expect("]");
					return { op: "array", items };
				}
				if (token.value === "{") {
					const entries: Record<string, RestrictedExpr> = {};
					while (!isPunct("}")) {
						if (peek().type === "eof") expect("}");
						if (isPunct(",")) {
							next();
							continue;
						}
						const key = next();
						if (key.type !== "ident" && key.type !== "str" && key.type !== "num") {
							error("Expected an object key (identifier, string or number)", key);
						}
						if (DANGEROUS_KEYS.has(key.value)) {
							error(
								`Dangerous property name "${key.value}" isn't allowed in restricted expressions`,
								key,
							);
						}
						expect(":");
						entries[key.value] = parseTernary();
						if (isPunct(",")) next();
					}
					expect("}");
					return { op: "object", entries };
				}
				if (token.value === "...") {
					error("Spread isn't supported in restricted expressions.", token);
				}
				if (token.value === "=>") {
					error(ARROWS_UNSUPPORTED, token);
				}
				if (ASSIGNMENT.has(token.value)) {
					error("Assignments aren't supported in restricted expressions.", token);
				}
				error(`Unexpected "${token.value}"`, token);
			}
		}
		// Unreachable for valid tokens; keeps the function total for EOF.
		error("Unexpected end of expression", token);
	}

	const expression = parseTernary();
	const trailing = peek();
	if (trailing.type !== "eof" && !allowTrailing) {
		if (trailing.type === "punct" && trailing.value === "=>") {
			error(ARROWS_UNSUPPORTED, trailing);
		}
		if (trailing.type === "punct" && ASSIGNMENT.has(trailing.value)) {
			error("Assignments aren't supported in restricted expressions.", trailing);
		}
		if (trailing.type === "ident" && RESERVED[trailing.value] !== undefined) {
			error(RESERVED[trailing.value], trailing);
		}
		error(`Unexpected "${trailing.value}" after expression`, trailing);
	}
	return {
		expression,
		end: trailing.type === "eof" ? offset + source.length : trailing.start,
	};
}
