import * as view from "@torpor/view";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import compileEmbed from "../src/server/compileEmbed";
import hydrateModuleEmbed from "../src/loader/hydrateModuleEmbed";
import mountEmbed from "../src/loader/mountEmbed";
import mountModuleEmbed from "../src/loader/mountModuleEmbed";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	function increment() {
		count.value++;
	}
	@render {
		<button onclick={increment}>Count: {count.value}</button>
	}
}
`;

const BRIDGE_SOURCE = `
export default function Caller($props: { $embed: any }) {
	function ping() {
		$props.$embed.emit("pinged", { ok: true });
	}
	@render {
		<button onclick={ping}>Ping</button>
	}
}
`;

/** Stand-in for the browser's module loader: strips the module's imports
 * (which the browser would resolve via import map or rewritten URLs) and
 * evaluates the rest with the real runtime exports in scope. */
function testImporter(code: string): Promise<{ default: unknown }> {
	const names = Object.keys(view);
	const name = code.match(/export default (?:async )?function (\w+)/)?.[1];
	if (!name) throw new Error("no default export found in test module");
	const importFree = code
		.replace("export default ", "")
		// Sucrase hoists helpers above the imports, so don't rely on line anchors
		.replace(/import\s*\{[^}]+\}\s*from\s*"[^"]*";/g, "");
	const make = new Function(...names, `${importFree}\nreturn ${name};`); // eslint-disable-line no-implied-eval
	return Promise.resolve({ default: make(...Object.values(view)) });
}

test("module format keeps imports, the default export, and drops types", () => {
	const artifact = compileEmbed("mod-1", SOURCE, { module: true });

	expect(artifact.format).toBe("module");
	expect(artifact.client.code).toMatch(/export default function/);
	expect(artifact.client.code).toMatch(/import\s.+"@torpor\/view"/);
	expect(artifact.client.code).not.toMatch(/:\s*\{?\s*start\??:/);
});

test("resolveImport rewrites import specifiers", () => {
	const artifact = compileEmbed("mod-2", SOURCE, {
		module: true,
		resolveImport: (spec) =>
			spec === "@torpor/view" ? "/modules/@torpor/view@1.2.6/index.mjs" : undefined,
	});

	expect(artifact.client.code).toContain('from "/modules/@torpor/view@1.2.6/index.mjs"');
	expect(artifact.client.code).not.toContain('"@torpor/view"');
});

test("unresolved specifiers are left as-is for an import map", () => {
	const artifact = compileEmbed("mod-3", SOURCE, { module: true, resolveImport: () => undefined });
	expect(artifact.client.code).toMatch(/import\s.+"@torpor\/view"/);
});

test("globals format is the default", () => {
	const artifact = compileEmbed("glob-1", SOURCE);
	expect(artifact.format).toBe("globals");
	expect(artifact.client.code).not.toMatch(/import\s/);
});

test("mountModuleEmbed runs via the injected importer", async () => {
	const artifact = compileEmbed("mod-run", SOURCE, { module: true });
	const loaded: string[] = [];

	const target = document.createElement("div");
	document.body.appendChild(target);

	const handle = await mountModuleEmbed(
		target,
		artifact,
		{ start: 9 },
		{
			import: async (code) => {
				loaded.push(code);
				return testImporter(code);
			},
		},
	);

	expect(loaded.length).toBe(1);
	expect(target.querySelector("button")?.textContent).toBe("Count: 9");

	const button = target.querySelector("button")!;
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(button.textContent).toBe("Count: 10");

	handle.unmount();
	expect(target.innerHTML).toBe("");
});

test("module artifacts are rejected by the sync loader with a clear error", () => {
	const artifact = compileEmbed("mod-blocked", SOURCE, { module: true });
	const target = document.createElement("div");
	document.body.appendChild(target);

	expect(() => mountEmbed(target, artifact)).toThrow("mountModuleEmbed");
});

test("version mismatches fail before loading", async () => {
	const artifact = compileEmbed("mod-stale", SOURCE, { module: true });
	artifact.version = "0.0.0-stale";
	let loaded = false;
	const target = document.createElement("div");
	document.body.appendChild(target);

	await expect(
		mountModuleEmbed(
			target,
			artifact,
			{},
			{
				import: async () => {
					loaded = true;
					return { default: () => {} };
				},
			},
		),
	).rejects.toThrow(/recompile/i);
	expect(loaded).toBe(false);
});

test("bridge is injected into module embeds", async () => {
	const artifact = compileEmbed("mod-bridge", BRIDGE_SOURCE, { module: true });
	const events: { type: string; artifactId: string }[] = [];

	const target = document.createElement("div");
	document.body.appendChild(target);

	await mountModuleEmbed(
		target,
		artifact,
		{},
		{
			bridge: createBridge({
				onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
			}),
			import: testImporter,
		},
	);

	(target.querySelector("button") as HTMLButtonElement).click();
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(events).toEqual([{ type: "pinged", artifactId: "mod-bridge" }]);
});

test("hydrateModuleEmbed hydrates server-rendered module embeds", async () => {
	const artifact = compileEmbed("mod-hydrate", SOURCE, { module: true });

	// Render the server build the way the host app would
	const { body } = await import("../src/server/renderEmbed").then((m) =>
		m.default(artifact, { props: { start: 4 } }),
	);

	const target = document.createElement("div");
	target.innerHTML = body;
	document.body.appendChild(target);

	await hydrateModuleEmbed(target, artifact, { start: 4 }, { import: testImporter });

	const button = target.querySelector("button")!;
	button.click();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(button.textContent).toBe("Count: 5");
});
