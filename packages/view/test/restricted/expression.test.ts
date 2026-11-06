import { expect, test } from "vite-plus/test";
import parseExpression, {
	RestrictedSyntaxError,
} from "../../src/compile/build/restricted/parseExpression";

function parseError(source: string, offset = 0): RestrictedSyntaxError {
	try {
		parseExpression(source, offset);
	} catch (error) {
		expect(error).toBeInstanceOf(RestrictedSyntaxError);
		return error as RestrictedSyntaxError;
	}
	throw new Error(`Expected a RestrictedSyntaxError for: ${source}`);
}

test("parses literals", () => {
	expect(parseExpression("42")).toEqual({ op: "lit", value: 42 });
	expect(parseExpression("4.5")).toEqual({ op: "lit", value: 4.5 });
	expect(parseExpression("1e3")).toEqual({ op: "lit", value: 1000 });
	expect(parseExpression('"hi"')).toEqual({ op: "lit", value: "hi" });
	expect(parseExpression("'hi'")).toEqual({ op: "lit", value: "hi" });
	expect(parseExpression("true")).toEqual({ op: "lit", value: true });
	expect(parseExpression("false")).toEqual({ op: "lit", value: false });
	expect(parseExpression("null")).toEqual({ op: "lit", value: null });
	// JSON-safe: undefined serializes as null
	expect(parseExpression("undefined")).toEqual({ op: "lit", value: null });
});

test("decodes string escapes", () => {
	expect(parseExpression('"a\\nb\\t\\"c\\\\d"')).toEqual({ op: "lit", value: 'a\nb\t"c\\d' });
	expect(parseExpression('"\\u0041"')).toEqual({ op: "lit", value: "A" });
});

test("parses refs and member/index access", () => {
	expect(parseExpression("t")).toEqual({ op: "ref", name: "t" });
	expect(parseExpression("$props.queue")).toEqual({
		op: "get",
		object: { op: "ref", name: "$props" },
		key: "queue",
	});
	expect(parseExpression("$data.tickets[0].title")).toEqual({
		op: "get",
		object: {
			op: "index",
			object: { op: "get", object: { op: "ref", name: "$data" }, key: "tickets" },
			index: { op: "lit", value: 0 },
		},
		key: "title",
	});
	expect(parseExpression("items[i + 1]")).toMatchObject({ op: "index" });
});

test("honors operator precedence and associativity", () => {
	// 1 + 2 * 3
	expect(parseExpression("1 + 2 * 3")).toEqual({
		op: "binary",
		operator: "+",
		left: { op: "lit", value: 1 },
		right: {
			op: "binary",
			operator: "*",
			left: { op: "lit", value: 2 },
			right: { op: "lit", value: 3 },
		},
	});
	// a === b && c  ->  (a === b) && c
	expect(parseExpression("a === b && c")).toMatchObject({
		op: "binary",
		operator: "&&",
		left: { op: "binary", operator: "===" },
	});
	// Left associativity: a - b - c  ->  (a - b) - c
	expect(parseExpression("a - b - c")).toMatchObject({
		op: "binary",
		operator: "-",
		left: { op: "binary", operator: "-" },
	});
	// Parentheses override precedence
	expect(parseExpression("(1 + 2) * 3")).toMatchObject({
		op: "binary",
		operator: "*",
		left: { op: "binary", operator: "+" },
	});
});

test("parses ternaries right-associatively", () => {
	expect(parseExpression("a ? b : c")).toEqual({
		op: "ternary",
		test: { op: "ref", name: "a" },
		consequent: { op: "ref", name: "b" },
		alternate: { op: "ref", name: "c" },
	});
	// a ? b : (c ? d : e)
	expect(parseExpression("a ? b : c ? d : e")).toMatchObject({
		op: "ternary",
		alternate: { op: "ternary" },
	});
});

test("parses unary operators", () => {
	expect(parseExpression("!t.isOpen")).toMatchObject({ op: "unary", operator: "!" });
	expect(parseExpression("-1")).toMatchObject({
		op: "unary",
		operator: "-",
		operand: { op: "lit" },
	});
	expect(parseExpression("typeof t.id")).toMatchObject({ op: "unary", operator: "typeof" });
	expect(parseExpression("!!x")).toMatchObject({
		op: "unary",
		operator: "!",
		operand: { op: "unary" },
	});
});

test("parses array and object literals", () => {
	expect(parseExpression('[1, "x",]')).toEqual({
		op: "array",
		items: [
			{ op: "lit", value: 1 },
			{ op: "lit", value: "x" },
		],
	});
	expect(parseExpression('{ late: due < now, "label": name }')).toEqual({
		op: "object",
		entries: {
			late: {
				op: "binary",
				operator: "<",
				left: { op: "ref", name: "due" },
				right: { op: "ref", name: "now" },
			},
			label: { op: "ref", name: "name" },
		},
	});
});

test("rejects calls and points authors at derive", () => {
	const error = parseError("format($data.x)");
	expect(error.message).toContain("Function calls aren't supported");
	expect(error.message).toContain("derive");
	expect(error.message).toContain("format");
	// The error points at the call paren
	expect(error.start).toBe(6);
});

test("rejects method calls", () => {
	const error = parseError("tickets.map(t)");
	expect(error.message).toContain("Function calls aren't supported");
	expect(error.start).toBe(11);
});

test("parses optional chaining", () => {
	expect(parseExpression("a?.b")).toEqual({
		op: "get",
		object: { op: "ref", name: "a" },
		key: "b",
		optional: true,
	});
	expect(parseExpression("a?.[0]")).toEqual({
		op: "index",
		object: { op: "ref", name: "a" },
		index: { op: "lit", value: 0 },
		optional: true,
	});
	// Non-optional access stays non-optional
	expect(parseExpression("a.b")).toEqual({
		op: "get",
		object: { op: "ref", name: "a" },
		key: "b",
	});
});

test("rejects arrows, updates and assignments", () => {
	expect(parseError("t => t").message).toContain("Arrow functions");
	expect(parseError("a++").message).toContain("Updates");
	expect(parseError("a = 1").message).toContain("Assignments");
	expect(parseError("a += 1").message).toContain("Assignments");
});

test("rejects unsupported syntax with targeted messages", () => {
	expect(parseError("new Date()").message).toContain("`new`");
	expect(parseError("await x").message).toContain("`await`");
	expect(parseError("[1, ...rest]").message).toContain("Spread");
	expect(parseError("`hi ${x}`").message).toContain("Template literals");
	expect(parseError("delete a.b").message).toContain("`delete`");
	expect(parseError("x instanceof Y").message).toContain("`instanceof`");
});

test("rejects dangerous property names", () => {
	expect(parseError("a.__proto__").message).toContain("Dangerous property name");
	expect(parseError("a.constructor").message).toContain("Dangerous property name");
	expect(parseError("{ __proto__: 1 }").message).toContain("Dangerous property name");
});

test("reports structural errors", () => {
	expect(parseError("1 +").message).toContain("Unexpected end of expression");
	expect(parseError('"open').message).toContain("Unterminated string");
	expect(parseError("a b").message).toContain('Unexpected "b"');
	expect(parseError("(1").message).toContain('Expected ")"');
	expect(parseError("[1, 2").message).toContain('Expected "]"');
	expect(parseError("{a: 1").message).toContain('Expected "}"');
	expect(parseError("}").message).toContain('Unexpected "}"');
});

test("error positions are offset into the original source", () => {
	const error = parseError("format($data.x)", 1000);
	expect(error.start).toBe(1006);
});
