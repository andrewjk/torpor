import { expect, test } from "vite-plus/test";
import { build, buildRestricted, parse } from "../../src/compile";
import type { RestrictedNode } from "../../src/compile";

const requirementKinds = {
	http: (
		spec: { key: string }[],
		report: (message: string, start: number, end: number) => void,
	) => {
		const keys = spec.map((entry) => entry.key);
		for (const allowed of keys) {
			if (!["url", "auth", "params", "pick", "sort", "limit"].includes(allowed)) {
				report(`Unknown http spec key "${allowed}"`, 0, 0);
			}
		}
	},
};

function compile(source: string, options?: Parameters<typeof buildRestricted>[1]) {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	return buildRestricted(parsed.template!, { source, requirementKinds, ...options });
}

function errorsOf(result: ReturnType<typeof buildRestricted>): string[] {
	return result.errors.map((error) => error.message);
}

function elements(nodes: RestrictedNode[]): Extract<RestrictedNode, { t: "el" }>[] {
	return nodes.filter((node): node is Extract<RestrictedNode, { t: "el" }> => node.t === "el");
}

test("serializes elements, static attributes and text interpolations", () => {
	const { program, errors } = compile(`
export default function Greeting($props: { name: string }) {
	@render {
		<p class="greeting" title='hi'>Hello {$props.name}!</p>
	}
}
`);
	expect(errors).toEqual([]);
	const [p] = elements(program.components[0].markup);
	expect(p).toEqual({
		t: "el",
		tag: "p",
		attrs: [
			{ name: "class", value: "greeting" },
			{ name: "title", value: "hi" },
		],
		children: [
			{
				t: "text",
				parts: ["Hello ", { op: "get", object: { op: "ref", name: "$props" }, key: "name" }, "!"],
			},
		],
	});
});

test("serializes boolean attributes, void elements and skipped events", () => {
	const { program, errors } = compile(`
export default function Form() {
	@render {
		<input disabled onclick={save} />
		<br>
	}
}
`);
	expect(errors).toEqual([]);
	const [input, br] = elements(program.components[0].markup);
	// Event handlers are client-side wiring; they never reach the server tree
	expect(input.attrs).toEqual([{ name: "disabled" }]);
	expect(br).toMatchObject({ t: "el", tag: "br", attrs: [], children: [] });
});

test("dynamic class values keep scoped styles", () => {
	const { program, errors } = compile(`
export default function Card($props: { active: boolean }) {
	@render {
		<div class={["card", $props.active && "active"]}>x</div>
	}
	@style {
		.card { color: red; }
	}
}
`);
	expect(errors).toEqual([]);
	const [div] = elements(program.components[0].markup);
	const classAttr = div.attrs.find((attr) => attr.name === "class");
	expect(classAttr).toMatchObject({ name: "class", format: "class" });
	expect((classAttr as { scoped?: string }).scoped).toMatch(/^torp-/);
	expect((classAttr as { expr: { op: string } }).expr.op).toBe("array");
});

test("static classes get the scoped hash appended", () => {
	const { program, errors } = compile(`
export default function Card() {
	@render {
		<div class="card">x</div>
	}
	@style {
		.card { color: red; }
	}
}
`);
	expect(errors).toEqual([]);
	const [div] = elements(program.components[0].markup);
	const classAttr = div.attrs.find((attr) => attr.name === "class") as { value: string };
	expect(classAttr.value).toMatch(/^card torp-/);
});

test("serializes @if / @else if / @else branches", () => {
	const { program, errors } = compile(`
export default function Branches($props: { n: number }) {
	@render {
		@if ($props.n > 5) {
			<p>big</p>
		} else if ($props.n > 0) {
			<p>small</p>
		} else {
			<p>none</p>
		}
	}
}
`);
	expect(errors).toEqual([]);
	const ifNode = program.components[0].markup.find((node) => node.t === "if");
	expect(ifNode).toMatchObject({
		t: "if",
		branches: [
			{ test: { op: "binary", operator: ">" } },
			{ test: { op: "binary", operator: ">" } },
			{},
		],
	});
});

test("serializes @for with @key", () => {
	const { program, errors } = compile(`
export default function Rows() {
	@render {
		<ul>
			@for (item of $data.tickets) {
				@key = item.id;
				<li>{item.title}</li>
			}
		</ul>
	}
}
`);
	expect(errors).toEqual([]);
	const [ul] = elements(program.components[0].markup);
	const forNode = ul.children.find((node) => node.t === "for");
	expect(forNode).toMatchObject({
		t: "for",
		item: "item",
		list: { op: "get", object: { op: "ref", name: "$data" }, key: "tickets" },
		key: {
			op: "get",
			object: { op: "ref", name: "item" },
			key: "id",
		},
	});
});

test("parses data requirements and validates their kind shape", () => {
	const { program, errors } = compile(`
data tickets from http {
	url: "https://api.example.test/tickets",
	params: { queue: $props.queue },
	sort: "recency",
};

export default function List($props: { queue: string }) {
	@render {
		<p>{$data.tickets.length}</p>
	}
}
`);
	expect(errors).toEqual([]);
	expect(program.requirements).toEqual([
		{
			name: "tickets",
			kind: "http",
			spec: {
				url: { op: "lit", value: "https://api.example.test/tickets" },
				params: {
					op: "object",
					entries: {
						queue: {
							op: "get",
							object: { op: "ref", name: "$props" },
							key: "queue",
						},
					},
				},
				sort: { op: "lit", value: "recency" },
			},
		},
	]);
});

test("unknown requirement kinds are a compile error", () => {
	const result = compile(
		`
data tickets from sql { table: "tickets" };

export default function List() {
	@render { <p>hi</p> }
}
`,
		{ requirementKinds: {} },
	);
	expect(errorsOf(result).join("\n")).toContain('Unknown data requirement kind "sql"');
});

test("requirement kind validators can reject spec keys", () => {
	const result = compile(`
data tickets from http { url: "https://x", bogus: 1 };

export default function List() {
	@render { <p>hi</p> }
}
`);
	expect(errorsOf(result).join("\n")).toContain('Unknown http spec key "bogus"');
});

test("requirement declarations are stripped from the JS builds and bind $data", () => {
	const source = `
data tickets from http { url: "https://api.example.test/tickets" };

export default function List() {
	@render {
		<p>{$data.tickets.length}</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);

	// Restricted first: build() trims whitespace in place, which invalidates
	// the parse-time spans restricted mode relies on
	const restricted = buildRestricted(parsed.template!, { source, requirementKinds });
	expect(restricted.errors).toEqual([]);

	const client = build(parsed.template!);
	expect(client.code).toContain("let $data = $props?.$data ?? {};");
	expect(client.code).not.toContain("data tickets from");

	const server = build(parsed.template!, { server: true });
	expect(server.code).toContain("let $data = $props?.$data ?? {};");
	expect(server.code).not.toContain("data tickets from");
});

test("serializes component usage as component nodes with fills", () => {
	const { program, errors } = compile(`
import { Widget } from "@mallet/ui";

export default function Dash($props: { show: boolean }) {
	@render {
		<Widget size={$props.show ? 2 : 1}>
			<p>content</p>
			<fill name="header">Header</fill>
		</Widget>
	}
}
`);
	expect(errors).toEqual([]);
	const componentNode = program.components[0].markup.find((node) => node.t === "component");
	expect(componentNode).toMatchObject({
		t: "component",
		name: "Widget",
	});
	const fills = (componentNode as { fills: { name: string; children: unknown[] }[] }).fills;
	expect(fills.map((fill) => fill.name)).toEqual(["_", "header"]);
	expect(
		(componentNode as { props: { name: string; expr?: unknown; value?: unknown }[] }).props,
	).toMatchObject([{ name: "size", expr: { op: "ternary" } }]);
});

test("serializes <slot> elements with fallbacks", () => {
	const { program, errors } = compile(`
export default function WithSlot() {
	@render {
		<slot name="header">Fallback</slot>
	}
}
`);
	expect(errors).toEqual([]);
	const slotNode = program.components[0].markup.find((node) => node.t === "slot");
	expect(slotNode).toMatchObject({ t: "slot", name: "header" });
	expect((slotNode as { children: { t: string; parts?: unknown[] }[] }).children[0]).toMatchObject({
		t: "text",
		parts: ["Fallback"],
	});
});

test("rejects unsupported constructs with positioned errors", () => {
	const cases: [string, RegExp][] = [
		[
			`export default function A() {
	@render {
		@html ($props.x)
	}
}`,
			/"@html group" isn't supported in restricted mode yet/,
		],
		[
			`export default function B() {
	@render {
		@switch ($props.x) {
			@case 1 {
				<p>x</p>
			}
		}
	}
}`,
			/@switch group/,
		],
		[
			`export default function C() {
	@render {
		@await {
			<p>x</p>
		} with {
			<p>y</p>
		}
	}
}`,
			/@await group/,
		],
		[
			`export default function E() {
	@render {
		<input &value={$props.x} />
	}
}`,
			/Form bindings/,
		],
		[
			`export default function F() {
	@render {
		<div class="a {$props.x}">x</div>
	}
}`,
			/Mixed static\/dynamic attribute values/,
		],
		[
			`export default function G() {
	@render {
		@for (item of items.filter(i => i.ok)) {
			<p>{item}</p>
		}
	}
}`,
			/Function calls aren't supported/,
		],
		[
			`export default function H() {
	@render {
		@for (let [a, b] of $props.xs) {
			<p>{a}</p>
		}
	}
}`,
			/Only `@for \(item of list\)`/,
		],
		[
			`export default function I() {
	@render {
		@if (format($props.x)) {
			<p>x</p>
		}
	}
}`,
			/Function calls aren't supported/,
		],
	];
	for (const [source, pattern] of cases) {
		const result = compile(source);
		const messages = errorsOf(result);
		expect(messages.length, `expected an error for: ${source}`).toBeGreaterThan(0);
		expect(messages.join("\n"), `for: ${source}`).toMatch(pattern);
		// Errors carry positions into the original file
		expect(result.errors[0].startIndex).toBeGreaterThanOrEqual(0);
	}
});

test("@head and @error blocks are rejected for now", () => {
	const head = compile(`
export default function A() {
	@head { <title>x</title> }
	@render { <p>x</p> }
}
`);
	expect(errorsOf(head).join("\n")).toContain("@head content isn't supported");

	const error = compile(`
export default function B() {
	@render { <p>x</p> }
	@error (err) { <p>{err}</p> }
}
`);
	expect(errorsOf(error).join("\n")).toContain("@error blocks aren't supported");
});

test("styles are built like the JS build", () => {
	const { styles } = compile(`
export default function A() {
	@render { <p>x</p> }
	@style {
		p { color: rebeccapurple; }
	}
}
`);
	expect(styles.length).toBe(1);
	expect(styles[0].style).toContain("rebeccapurple");
	expect(styles[0].hash).toBeTruthy();
});

test("serializes scoped class props on component usages", () => {
	const { program, errors } = compile(`
export default function Dash($props: { wide: boolean }) {
	@style {
		.card { color: red; }
		.wide { width: 100%; }
	}
	@render {
		<Card class="card" size={2}>
			<p>content</p>
		</Card>
		<Card class={$props.wide ? "wide" : ""}>
			<p>side</p>
		</Card>
		<Card>
			<p>plain</p>
		</Card>
	}
}
`);
	expect(errors).toEqual([]);
	const usages = program.components[0].markup.filter((node) => node.t === "component") as {
		props: { name: string; value?: string; expr?: unknown; scoped?: string }[];
	}[];

	// Static scoped class: value kept, hash class marked for the interpreter
	const static_ = usages[0]!;
	const classProp = static_.props.find((prop) => prop.name === "class");
	expect(classProp).toMatchObject({
		name: "class",
		value: "card",
		scoped: expect.stringMatching(/^torp-/),
	});

	// Reactive scoped class: expression + hash class
	const reactive = usages[1]!;
	const reactiveClass = reactive.props.find((prop) => prop.name === "class");
	expect(reactiveClass).toMatchObject({
		name: "class",
		scoped: expect.stringMatching(/^torp-/),
	});
	expect(reactiveClass!.scoped).toBe(static_.props.find((prop) => prop.name === "class")!.scoped);
	expect((reactiveClass as { expr: unknown }).expr).toBeDefined();

	// No class attribute: no class prop is synthesized (matches the JS builds)
	const plain = usages[2]!;
	expect(plain.props.find((prop) => prop.name === "class")).toBeUndefined();
});
