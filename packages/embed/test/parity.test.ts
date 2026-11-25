import { bindDataTemplate, build, parse } from "@torpor/view/compile";
import * as ssr from "@torpor/view/ssr";
import { transform } from "sucrase";
import { expect, test } from "vite-plus/test";
import {
	compileArtifact,
	deriveRequirementKind,
	httpRequirementKind,
	renderArtifact,
} from "../src/artifact";
import { hydrateEmbed } from "../src/index";
import { createBridge } from "../src/index";
import type EmbedArtifact from "../src/types/EmbedArtifact";

/**
 * Renders the same source through the real JS server build (the Node path),
 * which is the reference for byte-level parity.
 */
async function renderJsServer(
	source: string,
	props: Record<string, any>,
): Promise<{ body: string; styles: unknown[] }> {
	const parsed = parse(source, { allowUnknownComponents: true });
	expect(parsed.errors).toEqual([]);
	// The source reads `$data` from the injected bag; the JS build needs the
	// same binding the manifest path installs
	bindDataTemplate(parsed.template!);
	const built = build(parsed.template!, { server: true, source });
	// Strip imports before the TS transform (sucrase hoists helpers above them)
	const code = built.code.replace("export default ", "").replace(/^import\s.+\n/gm, "");
	const js = transform(code, { transforms: ["typescript"] }).code;
	const name = parsed.template!.components.find((component) => component.default)!.name!;
	const make = new Function(...Object.keys(ssr), `${js}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	const component = make(...Object.values(ssr));
	const result = (await component(props)) as { body: string };
	return { body: result.body, styles: built.styles };
}

/** Compiles an artifact, then byte-compares the interpreter output with the
 * real server build. */
async function assertParity(
	source: string,
	options?: { props?: Record<string, any>; data?: Record<string, unknown> },
): Promise<void> {
	const artifact = compileArtifact("parity", source, {
		requirementKinds: { derive: deriveRequirementKind, http: httpRequirementKind },
	});
	expect(artifact.server?.template).toBeDefined();

	const rendered = await renderArtifact(artifact, {
		props: options?.props ?? {},
		data: options?.data ?? {},
	});
	// The JS build reads the same data through props
	const reference = await renderJsServer(source, {
		...options?.props,
		$data: options?.data ?? {},
	});

	expect(rendered.body).toBe(reference.body);
	// Styles come from the same helper
	expect(rendered.styles).toEqual(reference.styles);
}

test("parity: elements, attributes and interpolated text", async () => {
	await assertParity(
		`
export default function Greeting($props: { name: string }) {
	@render {
		<p class="greeting" title='hi'>Hello {$props.name}!</p>
	}
}
`,
		{ props: { name: "Ada" } },
	);
});

test("parity: dynamic, conditional and boolean attributes", async () => {
	await assertParity(
		`
export default function Attrs($props: { on: boolean; label: string }) {
	@render {
		<input disabled type="text" value={$props.label} />
		<p title={$props.on ? "yes" : ""} data-off={$props.on ? "" : "off"}>x</p>
	}
}
`,
		{ props: { on: true, label: "a b" } },
	);
});

test("parity: scoped styles, dynamic classes and style objects", async () => {
	await assertParity(
		`
export default function Card($props: { active: boolean }) {
	@render {
		<div class="card" style={{ color: $props.active ? "red" : "blue", "margin-top": "2px" }}>
			<span class={["tag", $props.active && "active"]}>x</span>
		</div>
	}
	@style {
		.card { padding: 0; }
	}
}
`,
		{ props: { active: true } },
	);
});

test("parity: optional chaining and nullish values", async () => {
	await assertParity(
		`
export default function Opt($props: { user: { name?: string } | null }) {
	@render {
		<p>{$props.user?.name ?? "anonymous"}</p>
	}
}
`,
		{ props: { user: null } },
	);
});

test("parity: @if / @else if / @else", async () => {
	const source = `
export default function Branches($props: { n: number }) {
	@render {
		<div>
			@if ($props.n > 5) {
				<p>big</p>
			} else if ($props.n > 0) {
				<p>small</p>
			} else {
				<p>none</p>
			}
		</div>
	}
}
`;
	for (const n of [10, 3, -1]) await assertParity(source, { props: { n } });
});

test("parity: @for with @key, nested control and data", async () => {
	const source = `
export default function Rows($props: { show: boolean }) {
	@render {
		<ul>
			@for (t of $data.tickets) {
				@key = t.id;
				<li class={t.priority > 1 ? "urgent" : ""}>
					@if ($props.show && t.id === "1") {
						<b>{t.title}</b>
					} else {
						<span>{t.title}</span>
					}
				</li>
			}
		</ul>
	}
}
`;
	// Both sides need the data bag; requirements are skipped via `data`
	await assertParity(source, {
		props: { show: true },
		data: {
			tickets: [
				{ id: "1", title: "One", priority: 2 },
				{ id: "2", title: "Two", priority: 1 },
			],
		},
	});
});

test("parity: whitespace-heavy markup and pre/code preservation", async () => {
	await assertParity(
		`
export default function Whitespace($props: { x: string }) {
	@render {
		<div>

			<p>
				a
				{$props.x}
				b
			</p>

			<pre>  keep
	this  </pre>
			<code> a   b </code>

		</div>
	}
}
`,
		{ props: { x: "X" } },
	);
});

test("parity: void elements and text escaping", async () => {
	await assertParity(
		`
export default function Void($props: { raw: string }) {
	@render {
		<div>
			<br>
			<hr>
			<img src="x.png" alt="a">
			<p>{$props.raw}</p>
		</div>
	}
}
`,
		{ props: { raw: '<script>alert("x")</script> & more' } },
	);
});

test("artifact SSR output hydrates with the same client build", async () => {
	const source = `
export default function Section($props: { $embed: any; title: string }) {
	function ping() {
		$props.$embed.emit("pinged", { title: $props.title });
	}
	@render {
		<div>
			<p>{$props.title}</p>
			@if ($props.title.length > 0) {
				<button onclick={ping}>Ping</button>
			}
		</div>
	}
}
`;
	const artifact: EmbedArtifact = compileArtifact("hydrate-parity", source, {
		emits: ["pinged"],
	});
	const { body } = await renderArtifact(artifact, {
		props: { title: "Hello" },
		data: {},
	});

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	const events: { type: string; detail: unknown }[] = [];
	const handle = hydrateEmbed(
		target,
		artifact,
		{ title: "Hello" },
		{
			bridge: createBridge({
				onEvent: (type, detail) => events.push({ type, detail }),
			}),
			styles: false,
		},
	);

	const button = target.querySelector("button");
	expect(button).not.toBeNull();
	button!.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(events).toEqual([{ type: "pinged", detail: { title: "Hello" } }]);

	handle.unmount();
});
