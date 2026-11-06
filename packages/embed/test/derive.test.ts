import { expect, test } from "vite-plus/test";
import {
	compileRestricted,
	createHttpSource,
	deriveRequirementKind,
	httpRequirementKind,
	renderRestricted,
} from "../src/restricted";
import EmbedCompileError from "../src/types/EmbedCompileError";

const REQUIREMENT_KINDS = { rows: () => {}, derive: deriveRequirementKind };

const SOURCE = `
data tickets from rows { };
data view from derive {
	of: "tickets",
	where: $item.priority >= 2,
	map: { label: upper($item.title), due: formatDue($item.due) },
	sortBy: $item.priority,
	order: "desc",
	limit: 2,
};

export default function Inbox() {
	@render {
		<ul>
			@for (v of $data.view) {
				<li>{v.label} — {v.due}</li>
			}
		</ul>
	}
}
`;

const ROWS = [
	{ title: "a", priority: 1, due: 1 },
	{ title: "b", priority: 3, due: 2 },
	{ title: "c", priority: 2, due: 3 },
	{ title: "d", priority: 2, due: 4 },
];

const formatters = {
	upper: (value: unknown) => String(value).toUpperCase(),
	formatDue: (value: unknown) => `#${String(value)}`,
};

function artifact(source = SOURCE, kinds = REQUIREMENT_KINDS) {
	return compileRestricted("derive-test", source, { requirementKinds: kinds });
}

function compileErrorOf(source: string): EmbedCompileError {
	try {
		artifact(source);
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		return error as EmbedCompileError;
	}
	throw new Error("Expected a compile error");
}

test("derive filters, maps with host formatters, sorts and limits", async () => {
	const { body } = await renderRestricted(artifact(), {
		formatters,
		sources: { rows: () => ROWS },
	});

	expect(body).toContain("B — #2");
	expect(body).toContain("C — #3");
	// D is filtered by limit after the stable desc sort (C before D)
	expect(body).not.toContain("D");
	expect(body).not.toContain("A");
});

test("derive supports ascending order and $index", async () => {
	const source = `
data rowsIn from rows { };
data view from derive {
	of: "rowsIn",
	map: { label: upper($item.title), position: $index },
	sortBy: $item.priority,
	order: "asc",
};
export default function Inbox() {
	@render { <ul>@for (v of $data.view) { <li>{v.position}:{v.label}</li> }</ul> }
}
`;
	const { body } = await renderRestricted(artifact(source), {
		formatters,
		sources: { rows: () => ROWS },
	});
	// Ascending: a(1), c(2), d(2), b(3); $index is the input index
	expect(body.indexOf("0:A")).toBeGreaterThanOrEqual(0);
	expect(body.indexOf("0:A")).toBeLessThan(body.indexOf("2:C"));
	expect(body.indexOf("2:C")).toBeLessThan(body.indexOf("3:D"));
	expect(body.indexOf("3:D")).toBeLessThan(body.indexOf("1:B"));
});

test("derive chains over earlier derives", async () => {
	const source = `
data rowsIn from rows { };
data high from derive { of: "rowsIn", where: $item.priority >= 2 };
data labels from derive { of: "high", map: { label: upper($item.title) } };
export default function Inbox() {
	@render { <ul>@for (v of $data.labels) { <li>{v.label}</li> }</ul> }
}
`;
	const { body } = await renderRestricted(artifact(source), {
		formatters,
		sources: { rows: () => ROWS },
	});
	expect(body).toContain("B");
	expect(body).toContain("C");
	expect(body).toContain("D");
	expect(body).not.toContain("A");
});

test("derive composes with the http source kind", async () => {
	const source = `
data tickets from http {
	url: "https://api.example.test/tickets",
	pick: "items",
};
data view from derive {
	of: "tickets",
	map: { upperTitle: upper($item.title) },
};
export default function Inbox() {
	@render { <ul>@for (v of $data.view) { <li>{v.upperTitle}</li> }</ul> }
}
`;
	const embed = compileRestricted("http-derive", source, {
		requirementKinds: { http: httpRequirementKind, derive: deriveRequirementKind },
	});
	const { body } = await renderRestricted(embed, {
		formatters,
		sources: {
			http: createHttpSource({
				allowOrigins: ["https://api.example.test"],
				fetch: (async () =>
					new Response(JSON.stringify({ items: [{ title: "one" }, { title: "two" }] }), {
						headers: { "content-type": "application/json" },
					})) as typeof fetch,
			}),
		},
	});
	expect(body).toContain("ONE");
	expect(body).toContain("TWO");
});

test("unknown formatters fail loudly, naming the function", async () => {
	const source = `
data rowsIn from rows { };
data view from derive { of: "rowsIn", map: { x: nope($item.title) } };
export default function Inbox() {
	@render { <ul>@for (v of $data.view) { <li>{v.x}</li> }</ul> }
}
`;
	await expect(
		renderRestricted(artifact(source), { sources: { rows: () => ROWS } }),
	).rejects.toThrow(/Unknown host function "nope"/);
});

test("method calls are rejected at compile time in derive specs", () => {
	const source = `
data rowsIn from rows { };
data view from derive { of: "rowsIn", map: { x: $item.title.toUpperCase() } };
export default function Inbox() {
	@render { <ul>@for (v of $data.view) { <li>{v.x}</li> }</ul> }
}
`;
	const error = compileErrorOf(source);
	expect(error.errors[0].message).toMatch(/Only named host functions/);
});

test("derive shape validation", () => {
	const cases: [string, RegExp][] = [
		[
			`data rowsIn from rows { };
data view from derive { where: $item.x };
export default function A() { @render { <p>x</p> } }`,
			/need an "of" data name/,
		],
		[
			`data rowsIn from rows { };
data view from derive { of: rowsIn };
export default function A() { @render { <p>x</p> } }`,
			/"of" must be a string literal/,
		],
		[
			`data view from derive { of: "later" };
data later from rows { };
export default function A() { @render { <p>x</p> } }`,
			/not an earlier requirement/,
		],
		[
			`data rowsIn from rows { };
data view from derive { of: "rowsIn", order: "sideways" };
export default function A() { @render { <p>x</p> } }`,
			/"order" must be "asc" or "desc"/,
		],
		[
			`data rowsIn from rows { };
data view from derive { of: "rowsIn", limit: -1 };
export default function A() { @render { <p>x</p> } }`,
			/positive integer/,
		],
		[
			`data rowsIn from rows { };
data view from derive { of: "rowsIn", bogus: 1 };
export default function A() { @render { <p>x</p> } }`,
			/Unknown derive spec key "bogus"/,
		],
	];
	for (const [source, pattern] of cases) {
		expect(compileErrorOf(source).errors[0].message).toMatch(pattern);
	}
});

test("budgets: input rows, output rows and wall clock", async () => {
	const many = Array.from({ length: 50 }, (_, index) => ({ n: index }));

	const inputSource = `
data rowsIn from rows { };
data view from derive { of: "rowsIn" };
export default function A() {
	@render { <ul>@for (v of $data.view) { <li>{v.n}</li> }</ul> }
}
`;
	await expect(
		renderRestricted(artifact(inputSource), {
			sources: { rows: () => many },
			deriveLimits: { maxInputRows: 10 },
		}),
	).rejects.toThrow(/over the 10 row budget/);

	const { body } = await renderRestricted(artifact(inputSource), {
		sources: { rows: () => many },
		deriveLimits: { maxOutputRows: 1 },
	});
	expect(body).toContain(">0<");
	expect(body).not.toContain(">1<");

	const huge = Array.from({ length: 200_000 }, (_, index) => ({ n: index }));
	await expect(
		renderRestricted(artifact(inputSource), {
			sources: { rows: () => huge },
			deriveLimits: { maxInputRows: 1_000_000, maxOutputRows: 1, timeoutMs: 1 },
		}),
	).rejects.toThrow(/exceeded its 1ms budget/);
});

test("a pre-resolved data bag skips requirement resolution entirely", async () => {
	const { body } = await renderRestricted(artifact(), {
		data: { view: [{ label: "PRE", due: "#0" }] },
	});
	expect(body).toContain("PRE — #0");
});

test("derive input must be an array", async () => {
	await expect(
		renderRestricted(artifact(), {
			formatters,
			sources: { rows: () => ({ not: "an array" }) },
		}),
	).rejects.toThrow(/expects "tickets" to be an array/);
});
