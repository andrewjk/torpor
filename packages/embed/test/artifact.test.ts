import { expect, test } from "vite-plus/test";
import { compileArtifact, recompileArtifact, renderArtifact } from "../src/artifact";
import type { ArtifactAuditEntry } from "../src/artifact";
import { deriveRequirementKind } from "../src/artifact";
import { mountEmbed } from "../src/index";
import EmbedCompileError from "../src/types/EmbedCompileError";
import EmbedVersionError from "../src/types/EmbedVersionError";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
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

const DATA = {
	tickets: { kind: "tickets", queue: "$props.queue", sort: "recency" },
};

function artifact(): EmbedArtifact {
	return compileArtifact("inbox", SOURCE, { requirementKinds, data: DATA });
}

test("compiles an artifact with a serialized server build", () => {
	const embed = artifact();

	expect(embed.name).toBe("Inbox");
	expect(embed.server?.template).toBeDefined();
	expect(embed.client.code).not.toMatch(/^import\s/m);
	expect(embed.styles.length).toBe(1);
	// Data names are bound from props in the client build
	expect(embed.client.code).toMatch(/let \$data = /);
});

test("renders with a first-party source, resolving props in the spec", async () => {
	const specs: Record<string, unknown>[] = [];
	const { body, head, styles, data } = await renderArtifact(artifact(), {
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
	const { body } = await renderArtifact(artifact(), {
		props: { queue: "open" },
		data: { tickets: ROWS },
	});
	expect(body).toContain("Printer on fire");
});

test("missing source implementations fail with an actionable error", async () => {
	await expect(renderArtifact(artifact(), { props: { queue: "open" } })).rejects.toThrow(
		/No source implementation for data requirement kind "tickets"/,
	);
});

test("async sources are awaited", async () => {
	const { body } = await renderArtifact(artifact(), {
		props: { queue: "open" },
		sources: { tickets: async () => Promise.resolve(ROWS) },
	});
	expect(body).toContain("Printer on fire");
});

test("onAudit reports each requirement resolution", async () => {
	const entries: ArtifactAuditEntry[] = [];
	const { body } = await renderArtifact(artifact(), {
		props: { queue: "open" },
		sources: { tickets: () => ROWS },
		onAudit: (entry) => entries.push(entry),
	});

	expect(body).toContain("Printer on fire");
	expect(entries).toHaveLength(1);
	expect(entries[0].artifactId).toBe("inbox");
	expect(entries[0].name).toBe("tickets");
	expect(entries[0].kind).toBe("tickets");
	expect(entries[0].spec).toEqual({ queue: "open", sort: "recency" });
	expect(entries[0].ok).toBe(true);
	expect(entries[0].durationMs).toBeTypeOf("number");
	expect(entries[0].error).toBeUndefined();
});

test("onAudit reports failures, then the error still throws", async () => {
	const entries: ArtifactAuditEntry[] = [];
	await expect(
		renderArtifact(artifact(), {
			props: { queue: "open" },
			sources: {
				tickets: () => {
					throw new Error("tenant forbidden");
				},
			},
			onAudit: (entry) => entries.push(entry),
		}),
	).rejects.toThrow(/tenant forbidden/);

	expect(entries).toHaveLength(1);
	expect(entries[0].ok).toBe(false);
	expect(entries[0].error).toBe("tenant forbidden");
});

test("onAudit is not called when data is pre-resolved", async () => {
	let calls = 0;
	const { body } = await renderArtifact(artifact(), {
		props: { queue: "open" },
		data: { tickets: ROWS },
		onAudit: () => calls++,
	});
	expect(body).toContain("Printer on fire");
	expect(calls).toBe(0);
});

test("onAudit covers derive requirements with their static spec", async () => {
	const statsArtifact = compileArtifact(
		"stats",
		`
export default function Stats() {
	@render { <p>{$data.stats.count}</p> }
}
`,
		{
			requirementKinds: { tickets: () => {}, derive: deriveRequirementKind },
			data: {
				tickets: { kind: "tickets", queue: "open" },
				stats: { kind: "derive", of: "tickets", count: true },
			},
		},
	);
	const entries: ArtifactAuditEntry[] = [];
	await renderArtifact(statsArtifact, {
		sources: { tickets: () => ROWS },
		onAudit: (entry) => entries.push(entry),
	});

	// Both requirements audit, in declaration order
	expect(entries.map((entry) => entry.name)).toEqual(["tickets", "stats"]);
	// The derive entry carries its statically-evaluable fields only
	expect(entries[1].kind).toBe("derive");
	expect(entries[1].spec).toEqual({ of: "tickets", count: true });
	expect(entries[1].ok).toBe(true);
});

test("rejects artifacts without a server build", async () => {
	const notAnArtifact: EmbedArtifact = { ...artifact(), server: undefined };
	await expect(renderArtifact(notAnArtifact)).rejects.toThrow(/missing its server build/);
});

const MULTILINE_SOURCE = `
import {
	FieldRow,
} from "@host/ui";

// import FakeRow from "@host/fake"
const sample = 'import x from "y";';

export default function Section() {
	function lazy() {
		// dynamic imports are untouched by the client transform
		return import("@host/lazy");
	}
	@render {
		<FieldRow>
			<p>records ready</p>
		</FieldRow>
		<button onclick={lazy}>Lazy</button>
	}
}
`;

test("strips multi-line imports and leaves import-like text alone", async () => {
	const embed = compileArtifact("multiline", MULTILINE_SOURCE, { scope: ["@host/ui"] });

	// The declaration is stripped from the client build...
	expect(embed.client.code).not.toMatch(/^[ \t]*import[\s{]/m);
	// ...while import-like text in strings, comments, and dynamic import()
	// survive untouched
	expect(embed.client.code).toContain('import x from "y"');
	expect(embed.client.code).toContain('import("@host/lazy")');

	// And the mounted embed runs: the scoped binding is provided, the
	// string renders as text
	const hostClient = {
		FieldRow: ($parent: any, $anchor: any, _props: any, _context: any, $slots: any) => {
			const div = document.createElement("div");
			div.className = "field-row";
			if ($anchor && $anchor.parentNode === $parent) $parent.insertBefore(div, $anchor);
			else $parent.appendChild(div);
			$slots?._?.(div, null);
		},
	};
	const target = document.createElement("div");
	document.body.appendChild(target);
	const handle = mountEmbed(target, embed, {}, { scope: { "@host/ui": hostClient } });
	expect(target.querySelector(".field-row")).not.toBeNull();
	expect(target.querySelector("button")?.textContent).toBe("Lazy");
	handle.unmount();
});

test("enforces runtime versions with the edge-safe constant", async () => {
	const stale = artifact();
	stale.version = "0.0.0-stale";
	await expect(
		renderArtifact(stale, { props: { queue: "open" }, data: { tickets: [] } }),
	).rejects.toThrow(EmbedVersionError);

	// allowMismatch warns and renders
	const warn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => warnings.push(message);
	try {
		const { body } = await renderArtifact(stale, {
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

test("compileArtifact surfaces build errors with positions", () => {
	try {
		compileArtifact(
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
	expect(() =>
		compileArtifact("unknown-kind", SOURCE, {
			requirementKinds: {},
			data: { tickets: { kind: "tickets", queue: "open" } },
		}),
	).toThrow(/Unknown data requirement kind "tickets"/);
});

test("paint-then-mount: the client build renders from the same data bag", async () => {
	const embed = artifact();
	const data = { tickets: ROWS };

	const { body } = await renderArtifact(embed, {
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

test("recompileArtifact refreshes the version and keeps meta", () => {
	const stale: EmbedArtifact = {
		...artifact(),
		version: "0.0.0-stale",
		meta: { author: "ada" },
	};
	const fresh = recompileArtifact(stale, { requirementKinds, data: DATA });
	expect(fresh.version).not.toBe("0.0.0-stale");
	expect(fresh.meta).toEqual({ author: "ada" });
	expect(fresh.server?.template).toEqual(stale.server?.template);
});

test("escapes attribute values", async () => {
	const embed = compileArtifact(
		"attrs",
		`
export default function Attrs($props: { label: string }) {
	@render {
		<p title={$props.label}>x</p>
	}
}
`,
	);
	const { body } = await renderArtifact(embed, { props: { label: 'a "b" <c>' } });
	expect(body).toContain('title="a &quot;b&quot; <c>"');
});
