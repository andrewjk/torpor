// @vitest-environment node
import { join } from "node:path";
import { expect, test } from "vite-plus/test";

// R2.3: a real bundler pass over the compile entry, so a new dependency
// that pulls a Node builtin in fails here instead of in the host's
// deploy. Needs the node environment: esbuild refuses to run under jsdom.
test("compile entry bundles for the browser with no node: specifiers", async () => {
	const { build } = await import("esbuild");
	const result = await build({
		entryPoints: [join(import.meta.dirname, "../src/compile.ts")],
		bundle: true,
		write: false,
		format: "esm",
		platform: "browser",
		minify: true,
		logLevel: "silent",
	});
	const code = result.outputFiles[0].text;
	expect(code).not.toMatch(/from\s*"node:[a-z_]+"/);
	// Size budget so a new dependency can't silently bloat the worker bundle
	expect(code.length).toBeLessThan(400_000);
});
