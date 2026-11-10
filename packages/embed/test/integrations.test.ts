import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import assertRunnable from "../src/assertRunnable";
import { RUNTIME_VERSION } from "../src/restricted";
import { compileRestricted, recompileRestricted, renderRestricted } from "../src/restricted";
import { defineApp } from "../src/app";
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
};

const hostServer = {
	FieldRow: async (_props: any, _context: any, $slots: any) => {
		const inner = $slots?._ ? await $slots._() : "";
		return { body: `<div class="field-row">${inner}</div>`, head: "" };
	},
};

const manifest = defineApp({
	id: "example-section",
	// Data requirements live in the manifest; the host's source resolves
	// them with tenant scoping and authorization
	data: {
		records: { kind: "records" },
	},
	// The declared bridge surface: default deny for everything else
	api: { save: { payload: { name: "string" }, result: "ok" } },
	emits: ["saved"],
});

// A Mallet-shaped section: host component, manifest data, bridge save.
// State is an object ($watch wraps objects; the serialized initializer is
// what the server paint reads).
const SECTION_SOURCE = `
import { FieldRow } from "@host/ui";

export default function Section($props: { $embed: any }) {
	let saved = $watch({ value: false });
	async function save() {
		await $props.$embed.invoke("save", { name: "new record" });
		saved.value = true;
		$props.$embed.emit("saved", { ok: true });
	}
	@render {
		<FieldRow>
			@for (r of $data.records) {
				<p>{r.name}</p>
			}
		</FieldRow>
		<button onclick={save}>{saved.value ? "Saved" : "Save"}</button>
	}
	@style {
		button { padding: 4px; }
	}
}
`;

const ROWS = [{ name: "Alpha" }, { name: "Beta" }];

function sectionArtifact(): EmbedArtifact {
	return compileRestricted("example-section", SECTION_SOURCE, {
		requirementKinds: { records: () => {} },
		data: manifest.data,
		api: manifest.api,
		emits: manifest.emits,
	});
}

const sources = { records: () => ROWS };
const renderOptions = {
	components: { FieldRow: hostServer.FieldRow },
	sources,
};

// The full compile options: manifest data + declared bridge surface
const compileOptions = {
	requirementKinds: { records: () => {} },
	data: manifest.data,
	api: manifest.api,
	emits: manifest.emits,
};

test("edge-safe sources stay free of Node builtins", () => {
	const dirs = ["../src/restricted", "../src/app"];
	for (const dir of dirs) {
		const entries = readdirSync(join(import.meta.dirname, dir), { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			const content = readFileSync(join(import.meta.dirname, dir, entry.name), "utf8");
			expect(content, `${dir}/${entry.name} must not import node builtins`).not.toMatch(
				/from\s+"node:/,
			);
		}
	}
	for (const barrel of ["../src/restricted.ts", "../src/app.ts"]) {
		const content = readFileSync(join(import.meta.dirname, barrel), "utf8");
		expect(content).not.toMatch(/from\s+"node:/);
	}
});

test("RUNTIME_VERSION matches the built-against @torpor/view version", () => {
	expect(RUNTIME_VERSION).toBe(viewPkg.version);
	expect(sectionArtifact().version).toBe(RUNTIME_VERSION);
});

test("records the modules an embed imports, with local bindings", () => {
	const artifact = sectionArtifact();
	expect(artifact.imports).toEqual([{ source: "@host/ui", names: ["FieldRow"] }]);

	// The runtime is auto-provided and not recorded; type-only imports are
	// erased by the transform
	const plain = compileRestricted(
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
	expect(() =>
		compileRestricted("scoped-ok", SECTION_SOURCE, { ...compileOptions, scope: ["@host/ui"] }),
	).not.toThrow();
	try {
		compileRestricted("scoped-bad", SECTION_SOURCE, { ...compileOptions, scope: ["@other/ui"] });
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		expect((error as EmbedCompileError).message).toContain('"@host/ui"');
	}
});

test("enforces maxSourceBytes", () => {
	expect(() =>
		compileRestricted("fits", SECTION_SOURCE, { ...compileOptions, maxSourceBytes: 100_000 }),
	).not.toThrow();
	try {
		compileRestricted("too-big", SECTION_SOURCE, { ...compileOptions, maxSourceBytes: 10 });
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
		invoke: async () => "ok",
	});
	const handle = mountEmbed(
		target,
		artifact,
		// Paint-then-mount: the data bag the sources resolved ships as props
		{ $data: { records: ROWS } },
		{
			scope: { "@host/ui": hostClient },
			bridge,
		},
	);
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(target.querySelector(".field-row")).not.toBeNull();
	expect(target.textContent).toContain("Alpha");
	handle.unmount();
});

test("a missing scope entry fails loudly, naming the binding and module", () => {
	const artifact = sectionArtifact();
	const target = document.createElement("div");
	document.body.appendChild(target);

	expect(() => mountEmbed(target, artifact)).toThrow(/"FieldRow"[\s\S]*"@host\/ui"[\s\S]*scope/);
	// And there is only one binding to name here
});

test("renderRestricted with host components produces the same markup", async () => {
	const artifact = sectionArtifact();
	const { body } = await renderRestricted(artifact, renderOptions);

	expect(body).toContain('class="field-row"');
	expect(body).toContain("Alpha");
	expect(body).toContain("Beta");
});

test("recompileRestricted recovers stale artifacts and preserves meta", () => {
	const artifact = sectionArtifact();
	const stale: EmbedArtifact = { ...artifact, version: "0.0.0-stale", meta: { author: "ada" } };

	expect(() => assertRunnable(stale, RUNTIME_VERSION)).toThrow();
	const fresh = recompileRestricted(stale, compileOptions);
	expect(fresh.version).toBe(RUNTIME_VERSION);
	expect(fresh.meta).toEqual({ author: "ada" });
	expect(fresh.client.code).toBe(artifact.client.code);
	expect(() => assertRunnable(fresh, RUNTIME_VERSION)).not.toThrow();
});

test("Mallet fixture end-to-end: scoped SSR + styles + hydrate + bridge event", async () => {
	const artifact = sectionArtifact();
	const events: { type: string; artifactId: string }[] = [];
	const bridge = createBridge({
		onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
		invoke: async () => "ok",
	});

	// Server render with host components and manifest sources: host
	// component markup, resolved records, and inlinable styles. The
	// resolved bag comes back for hydration (paint-then-mount).
	const { body, styles, data } = await renderRestricted(artifact, renderOptions);
	expect(body).toContain('class="field-row"');
	expect(body).toContain("Alpha");
	expect(styles.some((s) => s.style.includes("padding: 4px"))).toBe(true);

	// Hydrate with the same scope + bridge: scoped client component renders,
	// events flow back with the artifact id
	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);
	hydrateEmbed(
		target,
		artifact,
		{ $data: data },
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
