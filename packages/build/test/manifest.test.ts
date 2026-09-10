import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { openApi } from "../src/openapi/plugin";
import manifest, { hasLoadExport } from "../src/site/manifest";
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
	// NOTE: This file exports `load` as a property — the plugin reads it on
	// the client and checks for a `load` export/property to detect whether to
	// emit a stub
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
		pageServer: "src/routes/about/+page.server.ts",
	});
	site.addRoute("/inline", {
		page: "src/routes/inline/+page.ts",
		pageServer: { load: async () => undefined },
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

	test("client build: server.ts files with a `load` export are stubbed", () => {
		const site = buildSite();
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		// Our /about/+page.server.ts exports `load`
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

	test("server build (ssr): route imports are processable by the bundler", () => {
		const site = buildSite();
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		// Route imports must NOT be marked `@vite-ignore`: in a production
		// build that leaves raw source paths in the bundle, which plain Node
		// (`tb --preview` via the node adapter) and wrangler can't load --
		// they need to be bundled into chunks with rewritten relative imports
		expect(code).not.toContain("@vite-ignore");
		expect(code).toContain(`import("${path.join(site.root, "src/routes/+page.ts")}")`);
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

	test("server build: emits the plugin execution loop when plugins are set", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.plugins = [async () => {}];
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain(`import __site from "${site.configFile}"`);
		expect(code).toContain("for (const __plugin of __site.plugins ?? [])");
		expect(code).toContain("await __plugin(__site)");
	});

	test("server build: imports the config file when only plugins are set", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.plugins = [() => {}];
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain(`import __site from "${site.configFile}"`);
	});

	test("client build: does not emit the plugin execution loop", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.plugins = [() => {}];
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).not.toContain("__plugin");
		expect(code).not.toContain("import __site");
	});

	test("server build: hands the env schema to @torpor/build/env", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.env = {
			"~standard": {
				version: 1,
				vendor: "test",
				validate: () => ({ value: {} }),
			},
		};
		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain(`import __site from "${site.configFile}"`);
		expect(code).toContain('from "@torpor/build/env"');
		expect(code).toContain("setEnvSchema(__site.env)");
	});

	test("client build: does not emit the env schema glue", () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.env = {
			"~standard": {
				version: 1,
				vendor: "test",
				validate: () => ({ value: {} }),
			},
		};
		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).not.toContain("@torpor/build/env");
		expect(code).not.toContain("import __site");
	});

	test("server build: emits the OpenAPI document endpoint when the plugin is configured", async () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		site.addRoute("/api/posts/[id]", {
			server: { get: async () => undefined },
		});
		await openApi({ path: "/openapi.json", toJsonSchema: (s) => s as any })(site);

		const plugin = manifest(site, true);
		const code = (plugin.load as any).call({}, MODULE_ID, { ssr: true }) as string;
		expect(code).toContain('from "@torpor/build/openapi"');
		expect(code).toContain(
			"buildOpenApiDocument(__entries, __site.pluginState.get(OPEN_API_STATE_KEY))",
		);
		expect(code).toContain("__openApiRoutes");
		// Inline endpoints are loaded via __site
		expect(code).toContain(
			'"/api/posts/[id]": () => Promise.resolve({ default: __site.inlineEndPoints',
		);
		// The document route is appended to the routes list
		expect(code).toContain(`path: "/openapi.json", type: 3`);
		expect(code).toContain("get: __openApiGet");
	});

	test("client build: does not emit the OpenAPI document endpoint", async () => {
		const site = buildSite();
		site.configFile = path.join(site.root, "site.config.ts");
		await openApi({ toJsonSchema: (s) => s as any })(site);

		const plugin = manifest(site, false);
		const code = (plugin.load as any).call({}, MODULE_ID, {}) as string;
		expect(code).not.toContain("__openApi");
		expect(code).not.toContain("@torpor/build/openapi");
	});
});

describe("hasLoadExport", () => {
	test("detects `load` as a property on the default export", () => {
		expect(hasLoadExport("export default { load: async () => undefined };")).toBe(true);
	});

	test("detects `load` as a method on the default export", () => {
		expect(hasLoadExport("export default { load() { return 1; } };")).toBe(true);
	});

	test("detects `export const load`", () => {
		expect(hasLoadExport("export const load = async () => undefined;")).toBe(true);
	});

	test("detects `export function load`", () => {
		expect(hasLoadExport("export function load() { return 1; }")).toBe(true);
	});

	test("detects `export async function load`", () => {
		expect(hasLoadExport("export async function load() { return 1; }")).toBe(true);
	});

	test("returns false when there is no load export", () => {
		expect(hasLoadExport("export default { actions: {} };")).toBe(false);
	});

	test("does not match `load:` appearing in a comment", () => {
		expect(hasLoadExport("// this calls load: somewhere\nexport default { actions: {} };")).toBe(
			false,
		);
	});
});
