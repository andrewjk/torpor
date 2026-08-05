import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import manifest from "../src/site/manifest";
import Site from "../src/site/Site";
import { PAGE_ROUTE } from "../src/types/RouteType";

const MODULE_ID = "@torpor/build/manifest";

let tmpRoot = "";

beforeAll(async () => {
	tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-manifest-test-"));
	await fs.mkdir(path.join(tmpRoot, "src/routes"), { recursive: true });
	await fs.mkdir(path.join(tmpRoot, "src/routes/about"), { recursive: true });
	await fs.mkdir(path.join(tmpRoot, "src/routes/inline"), { recursive: true });
	await fs.writeFile(path.join(tmpRoot, "src/routes/+page.ts"), "");
	await fs.writeFile(path.join(tmpRoot, "src/routes/about/+page.ts"), "");
	// NOTE: This file has a `load:` shorthand — the plugin reads it on the
	// client and greps for `load:` to detect whether to emit a stub
	await fs.writeFile(
		path.join(tmpRoot, "src/routes/about/+page.server.ts"),
		"export default { load: async () => undefined };",
	);
	await fs.writeFile(path.join(tmpRoot, "src/routes/inline/+page.ts"), "");
});

afterAll(async () => {
	if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
});

function buildSite(): Site {
	const site = new Site();
	site.root = tmpRoot;
	site.addRoute("/", { page: "src/routes/+page.ts" });
	site.addRoute("/about", {
		page: "src/routes/about/+page.ts",
		server: "src/routes/about/+page.server.ts",
	});
	site.addRoute("/inline", {
		page: "src/routes/inline/+page.ts",
		server: { load: async () => undefined },
	});
	return site;
}

describe("manifest plugin", () => {
	test("returns the manifest module id as resolveId", () => {
		const plugin = manifest(buildSite());
		const result = (plugin.resolveId as any).handler.call({}, MODULE_ID);
		expect(result).toBe(MODULE_ID);
	});

	test("resolveId returns undefined for unrelated ids", () => {
		const plugin = manifest(buildSite());
		const result = (plugin.resolveId as any).handler.call({}, "some-other-id");
		expect(result).toBeUndefined();
	});

	test("client build: generates a virtual module with routes", () => {
		const site = buildSite();
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).toContain("export default");
		expect(code).toContain("routes: [");
		// Each non-server route file appears as an import
		expect(code).toContain(`"${path.join(site.root, "src/routes/+page.ts")}"`);
		expect(code).toContain(`"${path.join(site.root, "src/routes/about/+page.ts")}"`);
	});

	test("client build: provides a `load` stub constant", () => {
		const site = buildSite();
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).toContain("const load = { default: { load: true } };");
	});

	test("client build: server.ts files are checked for `load:` and stubbed when found", () => {
		const site = buildSite();
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		// Our /about/+page.server.ts has `export const load = ...`
		expect(code).toContain(`path: "/about/~server", type: 1, endPoint: () => load`);
	});

	test("server build (ssr): includes server.ts files as imports", () => {
		const site = buildSite();
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain(`"${path.join(site.root, "src/routes/about/+page.server.ts")}"`);
		expect(code).toContain(`"${path.join(site.root, "src/routes/about/+page.ts")}"`);
		// On the server, no `const load = ...` stub is emitted
		expect(code).not.toContain("const load = { default: { load: true } };");
	});

	test("server build (ssr) without ssr option: behaves like client", () => {
		const site = buildSite();
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		// Not SSR -> client mode -> server.ts not imported
		expect(code).not.toContain(`"${path.join(site.root, "src/routes/about/+page.server.ts")}")`);
	});

	test("inline endpoints: server build imports the config file", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain(`import __site from "${site.configFile}"`);
		// The inline endpoint should be resolved via __site.inlineEndPoints
		expect(code).toMatch(/inlineEndPoints\[/);
	});

	test("inline endpoints: client build does NOT import the config file", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).not.toContain("import __site");
	});

	test("wraps .torp files as PageEndPoint on the server", async () => {
		const torpPath = path.join(tmpRoot, "src/routes/+page.torp");
		await fs.writeFile(torpPath, "");
		const site = new Site();
		site.root = tmpRoot;
		site.addRoute("/", { page: "src/routes/+page.torp" });
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toMatch(
			/\.torp"\)\.then\(\(m\) => \(\{ default: \{ component: m\.default \} \}\)\)/,
		);
	});

	test("emits subFolder information", () => {
		const site = new Site();
		site.root = tmpRoot;
		site.addRoute("/api/posts/[id]", { page: "src/api/posts/[id]/+page.ts" }, "api");
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).toContain('subFolder: "/api"');
	});

	test("route types are emitted as numeric constants", () => {
		const site = new Site();
		site.root = tmpRoot;
		site.addRoute("/", { page: "src/routes/+page.ts" });
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).toContain(`type: ${PAGE_ROUTE}`);
	});
});
