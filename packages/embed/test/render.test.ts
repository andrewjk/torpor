import { expect, test } from "vite-plus/test";
import compileEmbed from "../src/server/compileEmbed";
import renderEmbed from "../src/server/renderEmbed";
import EmbedVersionError from "../src/types/EmbedVersionError";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	@render {
		<p>Count: {count.value}</p>
	}
}
`;

const HANGING_SOURCE = `
export default function Slow($props: {}) {
	let $state = $watch({
		get data() {
			return $async(() => new Promise(() => {}), { source: "server" });
		},
	});
	@render {
		@await {
			<p>{$state.data}</p>
		} with {
			<p>loading</p>
		}
	}
}
`;

const BRIDGE_SOURCE = `
export default function Awaiter($props: { $embed: any }) {
	let $state = $watch({
		get data() {
			return $async(() => $props.$embed.invoke("fetch-data"), { source: "server" });
		},
	});
	@render {
		@await {
			<p>{$state.data}</p>
		} with {
			<p>loading</p>
		}
	}
}
`;

const LOOP_SOURCE = `
export default function Spinner($props: {}) {
	while (true) {}
	@render {
		<p>never</p>
	}
}
`;

function artifact(source = SOURCE, id = "counter-render"): EmbedArtifact {
	return compileEmbed(id, source);
}

test("renders an artifact to HTML", async () => {
	const { body, head } = await renderEmbed(artifact(), { props: { start: 3 } });
	expect(body).toContain("Count: 3");
	expect(head ?? "").toBe("");
});

test("styled artifacts ship their styles in both head and styles", async () => {
	const styled = compileEmbed(
		"styled-render",
		`
export default function S() {
	@render {
		<p>hello</p>
	}
	@style {
		p { color: rebeccapurple; }
	}
}
`,
	);
	const { body, head, styles } = await renderEmbed(styled, { props: {} });
	expect(body).toContain("hello");
	// The scoped styles ship in `head` -- place it in the page head
	expect(head).toContain("rebeccapurple");
	// ...and `styles` exposes the same CSS separately, for hosts that
	// place styles themselves. If you use `head`, don't also inline these.
	expect(styles.some((s) => s.style.includes("rebeccapurple"))).toBe(true);
});

test("injects the bridge as $embed during render", async () => {
	const calls: { method: string; artifactId: string }[] = [];
	const bridged = await renderEmbed(artifact(BRIDGE_SOURCE, "awaiter"), {
		bridge: {
			emit: () => {},
			invoke: async (method, _payload, source) => {
				calls.push({ method, artifactId: source?.artifactId ?? "unknown" });
				return "section data";
			},
		},
	});

	expect(bridged.body).toContain("section data");
	expect(calls).toEqual([{ method: "fetch-data", artifactId: "awaiter" }]);
});

test("rejects on a version mismatch", async () => {
	const art = artifact();
	art.version = "0.0.0-stale";
	await expect(renderEmbed(art)).rejects.toThrow(EmbedVersionError);
});

test("soft timeout rejects on a hanging (async) render", async () => {
	await expect(renderEmbed(artifact(HANGING_SOURCE, "slow"), { timeout: 150 })).rejects.toThrow(
		"timed out",
	);
});

test("isolate: true renders in a worker", async () => {
	const { body } = await renderEmbed(artifact(), {
		props: { start: 7 },
		isolate: true,
	});
	expect(body).toContain("Count: 7");
});

test("isolate: true hard-terminates a CPU-bound render", async () => {
	const start = Date.now();
	await expect(
		renderEmbed(artifact(LOOP_SOURCE, "spinner"), { isolate: true, timeout: 250 }),
	).rejects.toThrow("timed out");
	// The worker was terminated at the deadline instead of hanging forever
	expect(Date.now() - start).toBeLessThan(5000);
});
