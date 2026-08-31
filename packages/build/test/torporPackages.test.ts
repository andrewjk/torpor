import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import findTorporPackages, { addTorporPackageConfig } from "../src/utils/torporPackages";

let root = "";

beforeAll(() => {
	root = mkdtempSync(path.join(tmpdir(), "torpor-packages-"));

	// The site's package.json, with a few dependencies
	write(
		"package.json",
		JSON.stringify({
			name: "test-site",
			dependencies: {
				"fake-icons": "1.0.0",
				"plain-lib": "1.0.0",
				"@scope/icons": "1.0.0",
			},
		}),
	);

	// A torpor package, detected by its `torpor` field
	write(
		"node_modules/fake-icons/package.json",
		JSON.stringify({
			name: "fake-icons",
			torpor: "./index.js",
			dependencies: { "nested-icons": "1.0.0" },
		}),
	);
	write("node_modules/fake-icons/index.js", "export default 1");

	// A torpor package one level down, detected by its `.torp` exports
	write(
		"node_modules/nested-icons/package.json",
		JSON.stringify({
			name: "nested-icons",
			exports: { ".": "./index.torp" },
		}),
	);
	write("node_modules/nested-icons/index.torp", "export default 2");

	// A scoped torpor package whose package.json is not exported
	write(
		"node_modules/@scope/icons/package.json",
		JSON.stringify({
			name: "@scope/icons",
			exports: { ".": "./icon.torp" },
		}),
	);
	write("node_modules/@scope/icons/icon.torp", "export default 3");

	// A plain package, which should not be detected
	write(
		"node_modules/plain-lib/package.json",
		JSON.stringify({ name: "plain-lib", exports: { ".": "./index.js" } }),
	);
	write("node_modules/plain-lib/index.js", "export default 4");
});

afterAll(() => {
	rmSync(root, { recursive: true, force: true });
});

test("findTorporPackages -- detects torpor packages", () => {
	expect(findTorporPackages(root).sort()).toEqual(["@scope/icons", "fake-icons", "nested-icons"]);
});

test("findTorporPackages -- no site package.json", () => {
	expect(findTorporPackages(path.join(root, "does-not-exist"))).toEqual([]);
});

test("addTorporPackageConfig -- sets optimizeDeps and ssr config", () => {
	const config: Record<string, any> = {};
	addTorporPackageConfig(root, config as any);

	expect(config.optimizeDeps.exclude.sort()).toEqual([
		"@scope/icons",
		"fake-icons",
		"nested-icons",
	]);
	expect(config.ssr.noExternal.sort()).toEqual(["@scope/icons", "fake-icons", "nested-icons"]);
});

test("addTorporPackageConfig -- merges with existing config", () => {
	const config: Record<string, any> = {
		optimizeDeps: { exclude: ["other-dep"] },
		ssr: { noExternal: ["another-dep"] },
	};
	addTorporPackageConfig(root, config as any);

	expect(config.optimizeDeps.exclude).toContain("other-dep");
	expect(config.optimizeDeps.exclude).toContain("fake-icons");
	expect(config.ssr.noExternal).toContain("another-dep");
	expect(config.ssr.noExternal).toContain("fake-icons");
});

function write(relativePath: string, content: string) {
	const file = path.join(root, relativePath);
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, content);
}

test("findTorporPackages -- skips Node builtin shadowing deps", () => {
	// A package named like a builtin (e.g. "path") used to break resolution
	write(
		"node_modules/builtin-shadow/package.json",
		JSON.stringify({
			name: "builtin-shadow",
			dependencies: { path: "1.0.0" },
		}),
	);
	write("node_modules/builtin-shadow/index.js", "export default 5");

	expect(() => findTorporPackages(root)).not.toThrow();
	expect(findTorporPackages(root)).not.toContain("path");
});
