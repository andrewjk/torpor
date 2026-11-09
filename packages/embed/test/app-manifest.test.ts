import { expect, test } from "vite-plus/test";
import { defineApp, manifestRequirements } from "../src/app";
import { hydrateEmbed } from "../src";
import {
	compileRestricted,
	deriveRequirementKind,
	httpRequirementKind,
	renderRestricted,
} from "../src/restricted";

const KINDS = { http: httpRequirementKind, derive: deriveRequirementKind };

const PLAIN = `
export default function Tickets($props: { queue: string }) {
	@render {
		<ul>
			@for (t of $data.tickets) {
				<li>{t.title}</li>
			}
			<p>{$props.queue}</p>
		</ul>
	}
}
`;

test("defineApp types a manifest and returns plain JSON", () => {
	const manifest = defineApp({
		id: "tickets",
		props: { queue: "open" },
		data: {
			tickets: {
				kind: "http",
				url: "https://api.example.com/tickets",
				params: { queue: "$props.queue" },
				pick: "items",
			},
		},
	});
	expect(JSON.parse(JSON.stringify(manifest))).toEqual(manifest);
});

test("a manifest data block compiles a plain template and renders through sources", async () => {
	const artifact = compileRestricted("tickets", PLAIN, {
		requirementKinds: KINDS,
		data: {
			tickets: {
				kind: "http",
				url: "https://api.example.com/tickets",
				params: { queue: "$props.queue" },
				pick: "items",
			},
		},
	});

	// The client build must bind `$data` from props, exactly like the
	// in-source `data … from …` path does (sucrase rewrites the RHS, so
	// match the declaration)
	expect(artifact.client.code).toMatch(/let \$data = /);

	const specs: Record<string, unknown>[] = [];
	const { body, data } = await renderRestricted(artifact, {
		props: { queue: "late" },
		sources: {
			http: (spec) => {
				specs.push(spec);
				return [{ title: "one" }];
			},
		},
	});
	expect(specs).toEqual([
		{
			url: "https://api.example.com/tickets",
			params: { queue: "late" },
			pick: "items",
		},
	]);
	expect(body).toContain("one");
	expect(body).toContain("late");
	expect(data.tickets).toEqual([{ title: "one" }]);
});

test("paint-then-mount: a manifest app hydrates from the data bag", async () => {
	const artifact = compileRestricted("tickets", PLAIN, {
		requirementKinds: KINDS,
		data: {
			tickets: { kind: "http", url: "https://api.example.com/tickets", pick: "items" },
		},
	});
	const data = { tickets: [{ title: "from the paint" }] };
	const { body } = await renderRestricted(artifact, {
		props: { queue: "open" },
		data,
	});

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	// The client build binds $props.$data — no undeclared $data reference
	const handle = hydrateEmbed(target, artifact, { queue: "open", $data: data });
	expect(target.textContent).toContain("from the paint");
	expect(target.textContent).toContain("open");

	handle.unmount();
	expect(target.innerHTML).toBe("");
});

test("manifest data and in-source declarations are mutually exclusive", () => {
	expect(() =>
		compileRestricted(
			"mixed",
			`
data tickets from tickets { queue: "x" };
export default function Mixed() {
	@render { <p>{$data.tickets}</p> }
}
`,
			{
				requirementKinds: { tickets: () => {} },
				data: { extra: { kind: "http", url: "https://api.example.com/x" } },
			},
		),
	).toThrow(/not both/i);
});

test("unknown manifest kinds are compile errors", () => {
	expect(() =>
		compileRestricted("bad-kind", PLAIN, {
			requirementKinds: KINDS,
			data: { x: { kind: "sql", query: "select 1" } },
		}),
	).toThrow(/Unknown data requirement kind "sql"/);
});

test("malformed manifest specs name their requirement", () => {
	expect(() =>
		compileRestricted("bad-spec", PLAIN, {
			requirementKinds: KINDS,
			data: { x: { kind: "http", url: "not a url" } },
		}),
	).toThrow(/data "x"/);
});

test("derive resolves in manifest key order and sees earlier requirements", async () => {
	const artifact = compileRestricted("derived", PLAIN, {
		requirementKinds: KINDS,
		data: {
			tickets: {
				kind: "http",
				url: "https://api.example.com/tickets",
				pick: "items",
			},
			count: { kind: "derive", of: "tickets", count: true },
		},
	});

	const { data } = await renderRestricted(artifact, {
		sources: { http: () => [{ title: "a" }, { title: "b" }] },
	});
	expect(data.count).toEqual({ count: 2 });
});

test("manifestRequirements validates names and shapes without compiling", () => {
	const { requirements, errors } = manifestRequirements(
		{
			ok: { kind: "http", url: "https://api.example.com/x" },
			"not-an-identifier!": { kind: "http", url: "https://api.example.com/y" },
			missingKind: { url: "https://api.example.com/z" } as any,
		},
		KINDS,
	);
	expect(requirements.map((r) => r.name)).toEqual(["ok"]);
	expect(errors.length).toBe(2);
	expect(errors[0]!.message).toMatch(/Invalid data requirement name/);
	expect(errors[1]!.message).toMatch(/missing a "kind"/);
});
