// @vitest-environment node
import { join } from "node:path";
import { expect, test } from "vite-plus/test";

// R2.3: real bundler passes over the edge-safe entries, so a new dependency
// that pulls a Node builtin in fails here instead of in the host's deploy.
// Needs the node environment: esbuild refuses to run under jsdom.
const ENTRIES: { entry: string; budget: number }[] = [
	// The restricted entry (compiler + serializer + interpreter)
	{ entry: "../src/restricted.ts", budget: 600_000 },
];

test("edge-safe entries bundle for the browser with no node: specifiers", async () => {
	const { build } = await import("esbuild");
	for (const { entry, budget } of ENTRIES) {
		const result = await build({
			entryPoints: [join(import.meta.dirname, entry)],
			bundle: true,
			write: false,
			format: "esm",
			platform: "browser",
			minify: true,
			logLevel: "silent",
		});
		const code = result.outputFiles[0].text;
		expect(code, `${entry} must not import node builtins`).not.toMatch(/from\s*"node:[a-z_]+"/);
		// Size budget so a new dependency can't silently bloat a worker bundle
		expect(code.length, `${entry} size budget`).toBeLessThan(budget);
	}
});
