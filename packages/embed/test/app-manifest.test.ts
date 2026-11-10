import { expect, test } from "vite-plus/test";
import { defineApp, manifestRequirements } from "../src/app";
import { hydrateEmbed } from "../src";
import {
	compileRestricted,
	deriveRequirementKind,
	httpRequirementKind,
	renderRestricted,
	recompileRestricted,
} from "../src/restricted";
import EmbedCompileError from "../src/types/EmbedCompileError";

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

test("defineApp carries the declared bridge surface as plain JSON", () => {
	const manifest = defineApp({
		id: "poll",
		api: { vote: { payload: { choice: "yes" }, result: "ok" } },
		emits: ["voted"],
		pushes: ["votes-changed"],
	});
	expect(JSON.parse(JSON.stringify(manifest))).toEqual(manifest);
	// The api block doubles as a typed contract for EmbedApiBridge
	const contract: Record<string, { payload?: unknown; result?: unknown }> = manifest.api ?? {};
	expect(Object.keys(contract)).toEqual(["vote"]);
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

const SURFACE_SOURCE = `
export default function Poll($props: { $embed: any }) {
	async function submit() {
		await $props.$embed.invoke("vote", { choice: "yes" });
		$props.$embed.emit("voted");
	}
	$props.$embed.on("votes-changed", () => {});
	@render { <button onclick={submit}>Vote</button> }
}
`;

const SURFACE_OPTIONS = {
	requirementKinds: KINDS,
	api: { vote: { payload: { choice: "yes" }, result: "ok" } },
	emits: ["voted"],
	pushes: ["votes-changed"],
};

test("a declared surface compiles onto the artifact", () => {
	const embed = compileRestricted("poll", SURFACE_SOURCE, SURFACE_OPTIONS);
	expect(embed.surface).toEqual({
		api: ["vote"],
		emits: ["voted"],
		pushes: ["votes-changed"],
	});
});

test("calls outside a declared surface are compile errors", () => {
	const cases: [Record<string, unknown>, RegExp][] = [
		[
			{ api: { different: {} } },
			/invoke\("vote"\), which is not declared in the app manifest's api/,
		],
		[{ emits: ["something-else"] }, /emits "voted", which is not declared/],
		[
			{ pushes: ["other-push"] },
			/subscribes to "votes-changed".*not declared in the app manifest's pushes/s,
		],
	];
	for (const [surface, pattern] of cases) {
		let thrown: unknown;
		try {
			compileRestricted("poll", SURFACE_SOURCE, { ...SURFACE_OPTIONS, ...surface });
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toBeInstanceOf(EmbedCompileError);
		const messages = (thrown as EmbedCompileError).errors.map((error) => error.message).join("\n");
		expect(messages).toMatch(pattern);
	}
});

test("recompileRestricted keeps the declared surface", () => {
	const embed = compileRestricted("poll", SURFACE_SOURCE, SURFACE_OPTIONS);
	const fresh = recompileRestricted(embed, SURFACE_OPTIONS);
	expect(fresh.surface).toEqual(embed.surface);
});

test("using the bridge without a declared surface is a compile error", () => {
	let thrown: unknown;
	try {
		compileRestricted("poll-ungated", SURFACE_SOURCE, { requirementKinds: KINDS });
	} catch (error) {
		thrown = error;
	}
	expect(thrown).toBeInstanceOf(EmbedCompileError);
	const messages = (thrown as EmbedCompileError).errors.map((error) => error.message).join("\n");
	// Default deny: one error per undeclared section, naming the first call
	expect(messages).toMatch(/declares no api surface/);
	expect(messages).toMatch(/declares no emits surface/);
	expect(messages).toMatch(/declares no pushes surface/);
});
