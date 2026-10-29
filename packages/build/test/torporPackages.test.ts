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
				"bool-icons": "1.0.0",
				"hidden-icons": "1.0.0",
				"plain-lib": "1.0.0",
				"@scope/icons": "1.0.0",
				"torpor-with-deps": "1.0.0",
			},
		}),
	);

	// A torpor package, detected by its `torpor` field
	write(
		"node_modules/fake-icons/package.json",
		JSON.stringify({
			name: "fake-icons",
			torpor: "./index.js",
			dependencies: { "nested-icons": "1.0.0", "plain-dep": "1.0.0" },
		}),
	);
	write("node_modules/fake-icons/index.js", "export default 1");

	// A plain dependency of a torpor package. The torpor package is bundled
	// into the SSR build (`ssr.noExternal`), and its bare import of this
	// package would stay externalized -- unresolvable at runtime from the
	// build output under pnpm's strict node_modules layout -- so it must be
	// bundled too
	write(
		"node_modules/plain-dep/package.json",
		JSON.stringify({
			name: "plain-dep",
			exports: { ".": "./index.js" },
			dependencies: { "deep-plain": "1.0.0" },
		}),
	);
	write("node_modules/plain-dep/index.js", "export default 6");

	// A plain dependency of a plain dependency. Once `plain-dep` is bundled,
	// its own imports resolve (and inline) at build time, so this one does
	// NOT need to be bundled
	write(
		"node_modules/deep-plain/package.json",
		JSON.stringify({ name: "deep-plain", exports: { ".": "./index.js" } }),
	);
	write("node_modules/deep-plain/index.js", "export default 7");

	// A torpor package, detected by a boolean `torpor` marker
	write(
		"node_modules/bool-icons/package.json",
		JSON.stringify({
			name: "bool-icons",
			torpor: true,
			dependencies: { "nested-icons": "1.0.0" },
		}),
	);
	write("node_modules/bool-icons/index.js", "export default 1");

	// A torpor package whose exports map has no "." or "./package.json"
	// entry, so Node's resolver throws ERR_PACKAGE_PATH_NOT_EXPORTED for
	// both `name/package.json` and `name` -- detected via node_modules paths
	write(
		"node_modules/hidden-icons/package.json",
		JSON.stringify({
			name: "hidden-icons",
			torpor: true,
			exports: { "./icons": "./icons.torp" },
		}),
	);
	write("node_modules/hidden-icons/index.js", "export default 1");

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

	// Another torpor package sharing the same plain dependency, to cover the
	// visited-order case: `plain-dep` may be reached first through a plain
	// path (where bundling isn't forced) and must still be picked up through
	// this torpor one
	write(
		"node_modules/torpor-with-deps/package.json",
		JSON.stringify({
			name: "torpor-with-deps",
			torpor: true,
			dependencies: { "plain-dep": "1.0.0" },
		}),
	);
	write("node_modules/torpor-with-deps/index.js", "export default 8");

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
	expect(findTorporPackages(root).sort()).toEqual([
		"@scope/icons",
		"bool-icons",
		"fake-icons",
		"hidden-icons",
		"nested-icons",
		"torpor-with-deps",
	]);
});

test("findTorporPackages -- no site package.json", () => {
	expect(findTorporPackages(path.join(root, "does-not-exist"))).toEqual([]);
});

test("addTorporPackageConfig -- sets optimizeDeps and ssr config", () => {
	const config: Record<string, any> = {};
	addTorporPackageConfig(root, config as any);

	const expected = [
		"@scope/icons",
		"bool-icons",
		"fake-icons",
		"hidden-icons",
		"nested-icons",
		"torpor-with-deps",
	];
	expect(config.optimizeDeps.exclude.sort()).toEqual(expected);
	expect(config.ssr.optimizeDeps.exclude.sort()).toEqual(expected);
	expect(config.environments.ssr.optimizeDeps.exclude.sort()).toEqual(expected);

	// `ssr.noExternal` also bundles the plain direct dependencies of the
	// torpor packages: an externalized import in a bundled package can't be
	// resolved at runtime from the build output under pnpm's strict layout.
	// Transitive plain deps (below an already-bundled plain dep) resolve at
	// build time and are NOT bundled
	expect(config.ssr.noExternal.sort()).toEqual([...expected, "plain-dep"].sort());
	// The SSR dep optimizer has its own config in both legacy and
	// environment-scoped forms; both must exclude the torpor packages or a
	// cold start prebundles and parses their `.torp` files as JS
});

test("addTorporPackageConfig -- merges with existing config", () => {
	const config: Record<string, any> = {
		optimizeDeps: { exclude: ["other-dep"] },
		ssr: {
			noExternal: ["another-dep"],
			optimizeDeps: { exclude: ["ssr-other-dep"] },
		},
		environments: { ssr: { optimizeDeps: { exclude: ["env-other-dep"] } } },
	};
	addTorporPackageConfig(root, config as any);

	expect(config.optimizeDeps.exclude).toContain("other-dep");
	expect(config.optimizeDeps.exclude).toContain("fake-icons");
	expect(config.ssr.noExternal).toContain("another-dep");
	expect(config.ssr.noExternal).toContain("fake-icons");
	expect(config.ssr.optimizeDeps.exclude).toContain("ssr-other-dep");
	expect(config.ssr.optimizeDeps.exclude).toContain("fake-icons");
	expect(config.environments.ssr.optimizeDeps.exclude).toContain("env-other-dep");
	expect(config.environments.ssr.optimizeDeps.exclude).toContain("fake-icons");

	// Applying the config twice must not duplicate entries
	addTorporPackageConfig(root, config as any);
	expect(config.environments.ssr.optimizeDeps.exclude).toHaveLength(
		new Set(config.environments.ssr.optimizeDeps.exclude).size,
	);
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
