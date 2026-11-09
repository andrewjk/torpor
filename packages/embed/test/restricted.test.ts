import { expect, test } from "vite-plus/test";
import { compileEmbed } from "../src/compile";
import { compileRestricted, recompileRestricted, renderRestricted } from "../src/restricted";
import { mountEmbed } from "../src/index";
import EmbedCompileError from "../src/types/EmbedCompileError";
import EmbedVersionError from "../src/types/EmbedVersionError";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
data tickets from tickets {
	queue: $props.queue,
	sort: "recency",
};

export default function Inbox($props: { queue: string }) {
	@render {
		<ul class="inbox">
			@for (t of $data.tickets) {
				<li class={t.priority > 1 ? "urgent" : ""}>
					<a href={"#/tickets/" + t.id}>{t.title}</a>
					<span>{t.missing?.deep ?? ""}</span>
				</li>
			}
		</ul>
	}
	@style {
		.inbox { padding: 0; }
	}
}
`;

const requirementKinds = {
	tickets: () => {},
};

const ROWS = [
	{ id: "1", title: "Printer on fire", priority: 2 },
	{ id: "2", title: '<script>alert("x")</script>', priority: 1 },
];

function artifact(): EmbedArtifact {
	return compileRestricted("inbox", SOURCE, { requirementKinds });
}

test("compiles a restricted artifact with a serialized server build", () => {
	const embed = artifact();

	expect(embed.format).toBe("restricted");
	expect(embed.name).toBe("Inbox");
	expect(embed.server?.template).toBeDefined();
	expect(embed.server?.code).toBeUndefined();
	expect(embed.client.code).not.toMatch(/^import\s/m);
	expect(embed.styles.length).toBe(1);
	// Data names are bound from props in the client build
	expect(embed.client.code).toMatch(/let \$data = /);
	expect(embed.client.code).not.toContain("data tickets from");
});

test("renders with a first-party source, resolving props in the spec", async () => {
	const specs: Record<string, unknown>[] = [];
	const { body, head, styles, data } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			tickets: (spec) => {
				specs.push(spec);
				return ROWS;
			},
		},
	});

	expect(specs).toEqual([{ queue: "open", sort: "recency" }]);
	expect(body).toContain('<ul class="inbox torp-');
	expect(body).toContain("Printer on fire");
	expect(body).toContain('href="#/tickets/1"');
	expect(body).toContain('<li class="urgent');
	// Text is escaped (& < >) and missing deep reads do not throw
	expect(body).toContain("&lt;script&gt;");
	expect(head).toBe("");
	expect(styles.length).toBe(1);
	// The resolved bag comes back for hydration (paint-then-mount)
	expect(data.tickets).toEqual(ROWS);
});

test("accepts pre-resolved data and skips sources", async () => {
	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		data: { tickets: ROWS },
	});
	expect(body).toContain("Printer on fire");
});

test("missing source implementations fail with an actionable error", async () => {
	await expect(renderRestricted(artifact(), { props: { queue: "open" } })).rejects.toThrow(
		/No source implementation for data requirement kind "tickets"/,
	);
});

test("async sources are awaited", async () => {
	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: { tickets: async () => Promise.resolve(ROWS) },
	});
	expect(body).toContain("Printer on fire");
});

test("rejects non-restricted artifacts", async () => {
	const globalsArtifact = compileEmbed(
		"plain",
		`
export default function Plain() {
	@render { <p>hi</p> }
}
`,
	);
	await expect(renderRestricted(globalsArtifact)).rejects.toThrow(/not a restricted artifact/);
});

test("enforces runtime versions with the edge-safe constant", async () => {
	const stale = artifact();
	stale.version = "0.0.0-stale";
	await expect(
		renderRestricted(stale, { props: { queue: "open" }, data: { tickets: [] } }),
	).rejects.toThrow(EmbedVersionError);

	// allowMismatch warns and renders
	const warn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => warnings.push(message);
	try {
		const { body } = await renderRestricted(stale, {
			props: { queue: "open" },
			data: { tickets: [] },
			allowVersionMismatch: true,
		});
		expect(body).toContain("inbox");
		expect(warnings.some((warning) => warning.includes("Version mismatch"))).toBe(true);
	} finally {
		console.warn = warn;
	}
});

test("renderEmbed refuses restricted artifacts with a pointer", async () => {
	const renderEmbed = (await import("../src/server/renderEmbed")).default;
	await expect(renderEmbed(artifact())).rejects.toThrow(/renderRestricted/);
});

test("compileRestricted surfaces restricted-build errors with positions", () => {
	try {
		compileRestricted(
			"bad",
			`
export default function Bad() {
	@render {
		@html ($props.raw)
	}
}
`,
		);
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		const compileError = error as EmbedCompileError;
		expect(compileError.errors[0].message).toContain("@html");
		expect(compileError.errors[0].startIndex).toBeGreaterThan(0);
	}
});

test("unknown requirement kinds fail at compile time", () => {
	expect(() => compileRestricted("unknown-kind", SOURCE, { requirementKinds: {} })).toThrow(
		/Unknown data requirement kind "tickets"/,
	);
});

test("paint-then-mount: the client build renders from the same data bag", async () => {
	const embed = artifact();
	const data = { tickets: ROWS };

	const { body } = await renderRestricted(embed, {
		props: { queue: "open" },
		data,
	});

	// Client-side mount with the bag as props (the paint-then-mount contract)
	const target = document.createElement("div");
	document.body.appendChild(target);
	const handle = mountEmbed(target, embed, { $data: data });

	const ssrText = body
		.replaceAll(/<[^>]+>/g, "")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">");
	const clientText = target.textContent ?? "";
	expect(clientText).toContain("Printer on fire");
	expect(clientText).toContain('<script>alert("x")</script>');
	expect(ssrText).toContain("Printer on fire");

	handle.unmount();
	expect(target.innerHTML).toBe("");
});

test("recompileRestricted refreshes the version and keeps meta", () => {
	const stale: EmbedArtifact = {
		...artifact(),
		version: "0.0.0-stale",
		meta: { author: "ada" },
	};
	const fresh = recompileRestricted(stale, { requirementKinds });
	expect(fresh.version).not.toBe("0.0.0-stale");
	expect(fresh.meta).toEqual({ author: "ada" });
	expect(fresh.server?.template).toEqual(stale.server?.template);
});

test("escapes attribute values", async () => {
	const embed = compileRestricted(
		"attrs",
		`
export default function Attrs($props: { label: string }) {
	@render {
		<p title={$props.label}>x</p>
	}
}
`,
	);
	const { body } = await renderRestricted(embed, { props: { label: 'a "b" <c>' } });
	expect(body).toContain('title="a &quot;b&quot; <c>"');
});
