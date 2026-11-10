import { expect, test } from "vite-plus/test";
import {
	compileRestricted,
	createHttpSource,
	deriveRequirementKind,
	httpRequirementKind,
	renderRestricted,
} from "../src/restricted";
import type { ManifestRequirement } from "../src/app";
import EmbedCompileError from "../src/types/EmbedCompileError";

const REQUIREMENT_KINDS = { rows: () => {}, derive: deriveRequirementKind };

const SOURCE = `
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

const DATA: Record<string, ManifestRequirement> = {
	tickets: { kind: "rows" },
	view: {
		kind: "derive",
		of: "tickets",
		where: "$item.priority >= 2",
		map: { label: "upper($item.title)", due: "formatDue($item.due)" },
		sortBy: "$item.priority",
		order: "desc",
		limit: 2,
	},
};

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

function artifact(
	source = SOURCE,
	data: Record<string, ManifestRequirement> = DATA,
): ReturnType<typeof compileRestricted> {
	return compileRestricted("derive-test", source, { requirementKinds: REQUIREMENT_KINDS, data });
}

function compileErrorOf(
	source = SOURCE,
	data: Record<string, ManifestRequirement> = DATA,
): EmbedCompileError {
	try {
		artifact(source, data);
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
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		view: {
			kind: "derive",
			of: "tickets",
			map: { label: "upper($item.title)", position: "$index" },
			sortBy: "$item.priority",
			order: "asc",
		},
	};
	const source = `
export default function Inbox() {
	@render {
		<ul>@for (v of $data.view) { <li>{v.position}:{v.label}</li> }</ul>
	}
}
`;
	const { body } = await renderRestricted(artifact(source, data), {
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
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		high: { kind: "derive", of: "tickets", where: "$item.priority >= 2" },
		labels: { kind: "derive", of: "high", map: { label: "upper($item.title)" } },
	};
	const source = `
export default function Inbox() {
	@render { <ul>@for (v of $data.labels) { <li>{v.label}</li> }</ul> }
}
`;
	const { body } = await renderRestricted(artifact(source, data), {
		formatters,
		sources: { rows: () => ROWS },
	});
	expect(body).toContain("B");
	expect(body).toContain("C");
	expect(body).toContain("D");
	expect(body).not.toContain("A");
});

test("derive composes with the http source kind", async () => {
	const data: Record<string, ManifestRequirement> = {
		tickets: {
			kind: "http",
			url: "https://api.example.test/tickets",
			pick: "items",
		},
		view: {
			kind: "derive",
			of: "tickets",
			map: { upperTitle: "upper($item.title)" },
		},
	};
	const source = `
export default function Inbox() {
	@render { <ul>@for (v of $data.view) { <li>{v.upperTitle}</li> }</ul> }
}
`;
	const embed = compileRestricted("http-derive", source, {
		requirementKinds: { http: httpRequirementKind, derive: deriveRequirementKind },
		data,
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
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		view: { kind: "derive", of: "tickets", map: { x: "nope($item.title)" } },
	};
	await expect(
		renderRestricted(artifact(SOURCE, data), { sources: { rows: () => ROWS } }),
	).rejects.toThrow(/Unknown host function "nope"/);
});

test("method calls are rejected at compile time in derive specs", async () => {
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		view: { kind: "derive", of: "tickets", map: { x: "$item.title.toUpperCase()" } },
	};
	const error = compileErrorOf(SOURCE, data);
	expect(error.errors[0].message).toMatch(/Only named host functions/);
});

test("derive shape validation", () => {
	const cases: [Record<string, ManifestRequirement>, RegExp][] = [
		[{ view: { kind: "derive", where: "$item.x" } }, /need an "of" data name/],
		[{ view: { kind: "derive", of: 42 } }, /"of" must be a string literal/],
		[
			{ view: { kind: "derive", of: "later" }, later: { kind: "rows" } },
			/not an earlier requirement/,
		],
		[
			{
				tickets: { kind: "rows" },
				view: { kind: "derive", of: "tickets", order: "sideways" },
			},
			/"order" must be "asc" or "desc"/,
		],
		[
			{
				tickets: { kind: "rows" },
				view: { kind: "derive", of: "tickets", limit: -1 },
			},
			/positive integer/,
		],
		[
			{
				tickets: { kind: "rows" },
				view: { kind: "derive", of: "tickets", bogus: 1 },
			},
			/Unknown derive spec key "bogus"/,
		],
	];
	for (const [data, pattern] of cases) {
		expect(compileErrorOf(SOURCE, data).errors[0].message).toMatch(pattern);
	}
});

test("budgets: input rows, output rows and wall clock", async () => {
	const many = Array.from({ length: 50 }, (_, index) => ({ n: index }));

	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		view: { kind: "derive", of: "tickets" },
	};
	const source = `
export default function A() {
	@render { <ul>@for (v of $data.view) { <li>{v.n}</li> }</ul> }
}
`;
	await expect(
		renderRestricted(artifact(source, data), {
			sources: { rows: () => many },
			deriveLimits: { maxInputRows: 10 },
		}),
	).rejects.toThrow(/over the 10 row budget/);

	const { body } = await renderRestricted(artifact(source, data), {
		sources: { rows: () => many },
		deriveLimits: { maxOutputRows: 1 },
	});
	expect(body).toContain(">0<");
	expect(body).not.toContain(">1<");

	const huge = Array.from({ length: 200_000 }, (_, index) => ({ n: index }));
	await expect(
		renderRestricted(artifact(source, data), {
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

test("aggregate values over filtered rows", async () => {
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		stats: {
			kind: "derive",
			of: "tickets",
			where: "$item.priority >= 2",
			count: true,
			sum: "$item.points",
			average: "$item.points",
			min: "$item.points",
			max: "$item.points",
		},
	};
	const source = `
export default function Stats() {
	@render {
		<p data-count>{ $data.stats.count }</p>
		<p data-sum>{ $data.stats.sum }</p>
		<p data-average>{ $data.stats.average }</p>
		<p data-min>{ $data.stats.min }</p>
		<p data-max>{ $data.stats.max }</p>
	}
}
`;
	const rows = [
		{ priority: 1, points: 100 },
		{ priority: 3, points: 3 },
		{ priority: 2, points: 5 },
		{ priority: 2, points: null },
	];
	const { body } = await renderRestricted(artifact(source, data), {
		sources: { rows: () => rows },
	});
	// Rows passing where: 3, 5 (null row counts toward count, skips numeric aggregates)
	const doc = new DOMParser().parseFromString(body, "text/html");
	expect(doc.querySelector("[data-count]")?.textContent).toBe("3");
	expect(doc.querySelector("[data-sum]")?.textContent).toBe("8");
	expect(doc.querySelector("[data-average]")?.textContent).toBe("4");
	expect(doc.querySelector("[data-min]")?.textContent).toBe("3");
	expect(doc.querySelector("[data-max]")?.textContent).toBe("5");
});

test("aggregates over an empty set", async () => {
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		stats: {
			kind: "derive",
			of: "tickets",
			count: true,
			sum: "$item.points",
			min: "$item.points",
			max: "$item.points",
			average: "$item.points",
		},
	};
	const source = `
export default function Stats() {
	@render {
		<p data-count>{ $data.stats.count }</p>
		<p data-sum>{ $data.stats.sum }</p>
		<p data-min>{ $data.stats.min }</p>
		<p data-max>{ $data.stats.max }</p>
		<p data-average>{ $data.stats.average }</p>
	}
}
`;
	const { body } = await renderRestricted(artifact(source, data), {
		sources: { rows: () => [] },
	});
	const doc = new DOMParser().parseFromString(body, "text/html");
	expect(doc.querySelector("[data-count]")?.textContent).toBe("0");
	expect(doc.querySelector("[data-sum]")?.textContent).toBe("0");
	expect(doc.querySelector("[data-min]")?.textContent).toBe("");
	expect(doc.querySelector("[data-max]")?.textContent).toBe("");
	expect(doc.querySelector("[data-average]")?.textContent).toBe("");
});

test("aggregates can't combine with the row pipeline", () => {
	const error = compileErrorOf(SOURCE, {
		tickets: { kind: "rows" },
		stats: { kind: "derive", of: "tickets", count: true, limit: 5 },
	});
	expect(error.errors.map((e) => e.message).join("\n")).toContain(
		'Aggregates (count) produce a single value, so "limit" doesn\'t apply',
	);
});

test('aggregate "count" must be literal true', () => {
	const error = compileErrorOf(SOURCE, {
		tickets: { kind: "rows" },
		stats: { kind: "derive", of: "tickets", count: 1 },
	});
	expect(error.errors.map((e) => e.message).join("\n")).toContain(
		'derive "count" must be literal true',
	);
});

test("sum over non-numbers fails at resolve time", async () => {
	const data: Record<string, ManifestRequirement> = {
		tickets: { kind: "rows" },
		stats: { kind: "derive", of: "tickets", sum: "$item.title" },
	};
	const source = `
export default function Stats() {
	@render { <p>{ $data.stats.sum }</p> }
}
`;
	await expect(
		renderRestricted(artifact(source, data), {
			sources: { rows: () => ROWS },
		}),
	).rejects.toThrow(/sum must evaluate to a number/);
});
