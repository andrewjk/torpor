import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import scopeBridge from "../src/bridge/scopeBridge";
import compileArtifact from "../src/artifact/compileArtifact";
import mountEmbed from "../src/loader/mountEmbed";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
export default function FormSection($props: { $embed: any }) {
	let state = $watch({ reply: "" });
	async function submit() {
		const reply = await $props.$embed.invoke("save-section", { name: "ada" });
		state.reply = String(reply);
		$props.$embed.emit("submitted", reply);
	}
	@render {
		<button onclick={submit}>Submit</button>
		<p>{state.reply}</p>
	}
}
`;

function artifact(): EmbedArtifact {
	return compileArtifact("form-section", SOURCE, {
		api: { "save-section": {} },
		emits: ["submitted"],
	});
}

function tick(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 10));
}

function getButton(target: Element): HTMLButtonElement {
	const button = target.querySelector("button");
	if (!button) throw new Error("button not rendered");
	return button as HTMLButtonElement;
}

test("createBridge routes events to the host handler", () => {
	const events: { type: string; detail: unknown; artifactId: string }[] = [];
	const bridge = createBridge({
		onEvent: (type, detail, source) => events.push({ type, detail, artifactId: source.artifactId }),
	});

	bridge.emit("submitted", { ok: true }, { artifactId: "e1" });

	expect(events.length).toBe(1);
	expect(events[0].type).toBe("submitted");
	expect(events[0].detail).toEqual({ ok: true });
	expect(events[0].artifactId).toBe("e1");
});

test("createBridge round-trips invoke calls", async () => {
	const calls: { method: string; payload: unknown }[] = [];
	const bridge = createBridge({
		invoke: async (method, payload) => {
			calls.push({ method, payload });
			return `saved:${(payload as { name: string }).name}`;
		},
	});

	const reply = await bridge.invoke("save-section", { name: "ada" }, { artifactId: "e1" });

	expect(reply).toBe("saved:ada");
	expect(calls[0].method).toBe("save-section");
	expect(calls[0].payload).toEqual({ name: "ada" });
});

test("scopeBridge stamps the source on emit and invoke", async () => {
	const seen: (string | undefined)[] = [];
	const bridge = scopeBridge(
		createBridge({
			onEvent: (_type, _detail, source) => seen.push(source.artifactId),
			invoke: async () => {
				return "ok";
			},
		}),
		{ artifactId: "post-42" },
	);

	bridge.emit("submitted");
	await bridge.invoke("save-section");

	expect(seen[0]).toBe("post-42");
});

test("mountEmbed injects the bridge and embeds can use it", async () => {
	const events: { type: string; artifactId: string }[] = [];
	const bridge = createBridge({
		onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
		invoke: async (method, payload) => {
			expect(method).toBe("save-section");
			expect(payload).toEqual({ name: "ada" });
			return "ok";
		},
	});

	const target = document.createElement("div");
	document.body.appendChild(target);
	mountEmbed(target, artifact(), {}, { bridge });

	getButton(target).click();
	await tick();

	const reply = target.querySelector("p")?.textContent;
	expect(reply).toBe("ok");
	expect(events[0]).toEqual({ type: "submitted", artifactId: "form-section" });
});

test("an explicit $embed prop wins over options.bridge", async () => {
	const usedBridge = createBridge({ onEvent: () => {} });
	let usedExplicit = false;
	const explicit = createBridge({
		onEvent: () => (usedExplicit = true),
	});

	const target = document.createElement("div");
	document.body.appendChild(target);
	mountEmbed(target, artifact(), { $embed: explicit }, { bridge: usedBridge });

	getButton(target).click();
	await tick();

	// The embed emitted through the explicit bridge, not options.bridge
	expect(usedExplicit).toBe(true);
});

test("the default bridge warns on first use when nothing is wired up", async () => {
	const warn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => warnings.push(message);
	try {
		const target = document.createElement("div");
		document.body.appendChild(target);
		mountEmbed(target, artifact());

		getButton(target).click();
		await tick();

		expect(warnings.some((w) => w.includes("no invoke handler"))).toBe(true);
		expect(warnings.some((w) => w.includes("no onEvent handler"))).toBe(true);
	} finally {
		console.warn = warn;
	}
});

test("push targets by artifactId and unsubscribe stops delivery", () => {
	const bridge = createBridge({});
	const seen: unknown[] = [];
	const scoped = scopeBridge(bridge, { artifactId: "e1" });
	const off = scoped.on?.("data", (detail) => seen.push(detail));
	expect(typeof off).toBe("function");

	bridge.push("data", 1); // broadcast
	bridge.push("data", 2, "e1"); // targeted match
	bridge.push("data", 3, "other"); // targeted miss
	expect(seen).toEqual([1, 2]);

	off?.();
	bridge.push("data", 4);
	expect(seen).toEqual([1, 2]);
});

test("the scoped bridge omits push", () => {
	const scoped = scopeBridge(createBridge({}), { artifactId: "e1" });
	expect((scoped as { push?: unknown }).push).toBeUndefined();
	expect(typeof scoped.on).toBe("function");
});

const LIVE_SOURCE = `
export default function LiveCounter($props: { $embed: any }) {
	let state = $watch({ count: 0 });
	$props.$embed.on("count", (detail: any) => {
		state.count = Number(detail);
	});
	@render {
		<p>{state.count}</p>
	}
}
`;

function liveArtifact(): EmbedArtifact {
	return compileArtifact("live-counter", LIVE_SOURCE, { pushes: ["count"] });
}

test("push updates a mounted embed reactively", async () => {
	const bridge = createBridge({});
	const target = document.createElement("div");
	document.body.appendChild(target);
	mountEmbed(target, liveArtifact(), {}, { bridge });

	expect(target.querySelector("p")?.textContent).toBe("0");

	// Broadcast reaches the embed; the handler's $watch update re-renders
	bridge.push("count", 5);
	await tick();
	expect(target.querySelector("p")?.textContent).toBe("5");

	// Targeted at another artifact: no update
	bridge.push("count", 9, "other-embed");
	await tick();
	expect(target.querySelector("p")?.textContent).toBe("5");

	// Targeted at this artifact: update
	bridge.push("count", 9, "live-counter");
	await tick();
	expect(target.querySelector("p")?.textContent).toBe("9");
});

const SURFACE_SOURCE = `
export default function Guarded($props: { $embed: any }) {
	async function submit() {
		await $props.$embed.invoke("declared-method", {});
		// Dynamically composed names are invisible to the compile-time
		// scan — this is what the runtime warning is for
		const method = "rogue-method";
		await $props.$embed.invoke(method, {});
	}
	@render { <button onclick={submit}>Go</button> }
}
`;

test("calls outside a declared surface warn at runtime, once per call", async () => {
	const artifact = compileArtifact("guarded", SURFACE_SOURCE, {
		api: { "declared-method": {} },
	});
	const warn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => warnings.push(message);
	try {
		const bridge = createBridge({ invoke: async () => "ok" });
		const target = document.createElement("div");
		document.body.appendChild(target);
		mountEmbed(target, artifact, {}, { bridge });

		getButton(target).click();
		await tick();

		// The declared call is silent; the rogue one warns, naming the section
		const rogue = warnings.filter((w) => w.includes("rogue-method"));
		expect(rogue.length).toBe(1);
		expect(rogue[0]).toMatch(/invoked "rogue-method", which is not declared in its app manifest/);
		expect(warnings.some((w) => w.includes("declared-method"))).toBe(false);

		// A second run warns again only for new names — declared stays quiet
		getButton(target).click();
		await tick();
		expect(warnings.filter((w) => w.includes("rogue-method")).length).toBe(1);
	} finally {
		console.warn = warn;
	}
});
