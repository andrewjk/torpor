import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import { compileEmbed, recompileEmbed, RUNTIME_VERSION } from "../src/compile";
import getRuntimeVersion from "../src/server/getRuntimeVersion";
import renderEmbed from "../src/server/renderEmbed";
import assertRunnable from "../src/server/assertRunnable";
import mountEmbed from "../src/loader/mountEmbed";
import hydrateEmbed from "../src/loader/hydrateEmbed";
import EmbedCompileError from "../src/types/EmbedCompileError";
import type EmbedArtifact from "../src/types/EmbedArtifact";
import viewPkg from "../../view/package.json";

// A fake host UI kit, standing in for @torpor/ui: client- and server-side
// versions of the same component, as a real host would provide.
const hostClient = {
	FieldRow: ($parent: any, $anchor: any, _props: any, _context: any, $slots: any) => {
		const div = document.createElement("div");
		div.className = "field-row";
		if ($anchor && $anchor.parentNode === $parent) $parent.insertBefore(div, $anchor);
		else $parent.appendChild(div);
		$slots?._?.(div, null);
	},
	shout: (text: string) => `${text.toUpperCase()}!`,
};

const hostServer = {
	FieldRow: async (_props: any, _context: any, $slots: any) => {
		const inner = $slots?._ ? await $slots._() : "";
		return { body: `<div class="field-row">${inner}</div>`, head: "" };
	},
	shout: (text: string) => `${text.toUpperCase()}!`,
};

// A Mallet-shaped section: scoped host component, bridge fetch during
// render (server) / events (client), and scoped styles.
const SECTION_SOURCE = `
import { FieldRow, shout } from "@host/ui";

export default function Section($props: { $embed: any }) {
	let $state = $watch({
		get saved() {
			return $async(() => $props.$embed.invoke("fetch-data"), { source: "server" });
		},
	});
	function save() {
		$props.$embed.emit("saved", { ok: true });
	}
	@render {
		@await {
			<FieldRow>{shout($state.saved)}</FieldRow>
		} with {
			<p>loading</p>
		}
		<button onclick={save}>Save</button>
	}
	@style {
		button { padding: 4px; }
	}
}
`;

function sectionArtifact(): EmbedArtifact {
	return compileEmbed("example-section", SECTION_SOURCE);
}

test("compile entry stays free of Node builtins", () => {
	const dir = join(import.meta.dirname, "../src/compile");
	for (const file of readdirSync(dir)) {
		const content = readFileSync(join(dir, file), "utf8");
		expect(content, `${file} must not import node builtins`).not.toMatch(/from\s+"node:/);
	}
	const barrel = readFileSync(join(import.meta.dirname, "../src/compile.ts"), "utf8");
	expect(barrel).not.toMatch(/from\s+"node:/);
});

test("RUNTIME_VERSION matches the built-against @torpor/view version", () => {
	expect(RUNTIME_VERSION).toBe(viewPkg.version);
	expect(compileEmbed("v", SECTION_SOURCE).version).toBe(RUNTIME_VERSION);
	expect(getRuntimeVersion()).toBe(RUNTIME_VERSION);
});

test("records the modules an embed imports, with local bindings", () => {
	const artifact = sectionArtifact();
	expect(artifact.imports).toEqual([{ source: "@host/ui", names: ["FieldRow", "shout"] }]);

	// The runtime is auto-provided and not recorded; type-only imports are
	// erased by the transform
	const plain = compileEmbed(
		"plain",
		`
import { type SlotRender } from "@torpor/view";
export default function Plain() {
	@render {
		<p>hi</p>
	}
}
`,
	);
	expect(plain.imports).toBeUndefined();
});

test("compile scope whitelist rejects imports outside it", () => {
	expect(() => compileEmbed("scoped-ok", SECTION_SOURCE, { scope: ["@host/ui"] })).not.toThrow();
	try {
		compileEmbed("scoped-bad", SECTION_SOURCE, { scope: ["@other/ui"] });
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		expect((error as EmbedCompileError).message).toContain('"@host/ui"');
	}
});

test("enforces maxSourceBytes", () => {
	expect(() => compileEmbed("fits", SECTION_SOURCE, { maxSourceBytes: 100_000 })).not.toThrow();
	try {
		compileEmbed("too-big", SECTION_SOURCE, { maxSourceBytes: 10 });
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		expect((error as EmbedCompileError).message).toMatch(/bytes, over the 10 byte limit/);
	}
});

test("mountEmbed injects host modules via scope", async () => {
	const artifact = sectionArtifact();
	const target = document.createElement("div");
	document.body.appendChild(target);

	const bridge = createBridge({
		onEvent: () => {},
		invoke: async (method) => (method === "fetch-data" ? "section data" : undefined),
	});
	const handle = mountEmbed(
		target,
		artifact,
		{},
		{
			scope: { "@host/ui": hostClient },
			bridge,
		},
	);
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(target.querySelector(".field-row")).not.toBeNull();
	expect(target.textContent).toContain("SECTION DATA!");
	handle.unmount();
});

test("a missing scope entry fails loudly, naming the binding and module", () => {
	const artifact = sectionArtifact();
	const target = document.createElement("div");
	document.body.appendChild(target);

	expect(() => mountEmbed(target, artifact)).toThrow(/"FieldRow"[\s\S]*"@host\/ui"[\s\S]*scope/);
	// And names every missing binding
	expect(() => mountEmbed(target, artifact)).toThrow(/"shout"/);
});

test("renderEmbed with scope produces the same host-component markup", async () => {
	const artifact = sectionArtifact();
	const { body } = await renderEmbed(artifact, {
		scope: { "@host/ui": hostServer },
		bridge: {
			emit: () => {},
			invoke: async (method) => (method === "fetch-data" ? "section data" : undefined),
		},
	});

	expect(body).toContain('class="field-row"');
	expect(body).toContain("SECTION DATA!");
});

test("recompileEmbed recovers stale artifacts and preserves meta", () => {
	const artifact = sectionArtifact();
	const stale: EmbedArtifact = { ...artifact, version: "0.0.0-stale", meta: { author: "ada" } };

	expect(() => assertRunnable(stale, getRuntimeVersion())).toThrow();
	const fresh = recompileEmbed(stale);
	expect(fresh.version).toBe(getRuntimeVersion());
	expect(fresh.meta).toEqual({ author: "ada" });
	expect(fresh.client.code).toBe(artifact.client.code);
	expect(() => assertRunnable(fresh, getRuntimeVersion())).not.toThrow();
});

test("Mallet fixture end-to-end: scoped SSR + styles + hydrate + bridge event", async () => {
	const artifact = sectionArtifact();
	const events: { type: string; artifactId: string }[] = [];
	const bridge = createBridge({
		onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
		invoke: async (method) => (method === "fetch-data" ? "section data" : undefined),
	});

	// Server render with scope + bridge: host component markup, resolved
	// fetch, and inlinable styles
	const { body, styles } = await renderEmbed(artifact, {
		scope: { "@host/ui": hostServer },
		bridge,
	});
	expect(body).toContain('class="field-row"');
	expect(body).toContain("section data");
	expect(styles.some((s) => s.style.includes("padding: 4px"))).toBe(true);

	// Hydrate with the same scope + bridge: scoped client component renders,
	// events flow back with the artifact id
	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);
	// hydrateEmbed is synchronous (globals format)
	hydrateEmbed(
		target,
		artifact,
		{},
		{
			scope: { "@host/ui": hostClient },
			bridge,
			styles: false, // the server already inlined them
		},
	);

	expect(target.querySelector(".field-row")).not.toBeNull();
	const button = target.querySelector("button") as HTMLButtonElement;
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(events).toEqual([{ type: "saved", artifactId: "example-section" }]);
});
