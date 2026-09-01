import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { clearStaleDepCache } from "../src/run/depCache";

let root: string;
let site: string;

beforeEach(() => {
	// A monorepo: <root>/pnpm-workspace.yaml + <root>/packages/ui + <root>/site,
	// with site/node_modules/@x/ui symlinked to the workspace package (as pnpm
	// does for workspace deps)
	root = realpathSync(mkdtempSync(path.join(tmpdir(), "torpor-depcache-")));
	site = path.join(root, "site");
	mkdirSync(path.join(root, "packages", "ui"), { recursive: true });
	mkdirSync(site, { recursive: true });

	writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
	writeFileSync(
		path.join(root, "packages", "ui", "package.json"),
		JSON.stringify({ name: "@x/ui" }),
	);
	writeFileSync(path.join(root, "packages", "ui", "index.js"), "export {};\n");
	writeFileSync(
		path.join(site, "package.json"),
		JSON.stringify({ name: "site", dependencies: { "@x/ui": "workspace:*" } }),
	);
	mkdirSync(path.join(site, "node_modules", "@x"), { recursive: true });
	symlinkSync(
		path.join(root, "packages", "ui"),
		path.join(site, "node_modules", "@x", "ui"),
		"dir",
	);
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

function makeCache() {
	const deps = path.join(site, "node_modules", ".vite", "deps");
	mkdirSync(deps, { recursive: true });
	writeFileSync(path.join(deps, "chunk.js"), "// cached");
}

describe("clearStaleDepCache", () => {
	test("clears the cache on the first run and writes the store", () => {
		makeCache();

		const cleared = clearStaleDepCache(site);

		expect(cleared).toBe(true);
		expect(existsSync(path.join(site, "node_modules", ".vite"))).toBe(false);
		expect(existsSync(path.join(site, "node_modules", ".torpor-dev-cache.json"))).toBe(true);
	});

	test("leaves the cache alone when nothing changed", () => {
		clearStaleDepCache(site);

		// Recreate the cache as Vite would after re-optimizing
		makeCache();
		const cleared = clearStaleDepCache(site);

		expect(cleared).toBe(false);
		expect(existsSync(path.join(site, "node_modules", ".vite"))).toBe(true);
	});

	test("clears again when a workspace package is rebuilt", () => {
		clearStaleDepCache(site);
		makeCache();

		// A rebuild rewrites the package's output; bump the mtime explicitly
		// so the change is visible beyond millisecond granularity
		const index = path.join(root, "packages", "ui", "index.js");
		writeFileSync(index, "export const x = 1;\n");
		const later = new Date(Date.now() + 5000);
		utimesSync(index, later, later);

		const cleared = clearStaleDepCache(site);

		expect(cleared).toBe(true);
		expect(existsSync(path.join(site, "node_modules", ".vite"))).toBe(false);
	});

	test("ignores dependencies outside the workspace", () => {
		// A second temp root that is NOT under the monorepo root
		const outsideRoot = realpathSync(mkdtempSync(path.join(tmpdir(), "torpor-outside-")));
		mkdirSync(outsideRoot, { recursive: true });
		writeFileSync(path.join(outsideRoot, "package.json"), JSON.stringify({ name: "outside" }));

		const pkgPath = path.join(site, "package.json");
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
		pkg.dependencies.outside = "*";
		writeFileSync(pkgPath, JSON.stringify(pkg));
		symlinkSync(outsideRoot, path.join(site, "node_modules", "outside"), "dir");

		clearStaleDepCache(site);
		makeCache();

		// Changing it does not invalidate the cache
		writeFileSync(path.join(outsideRoot, "index.js"), "x");
		const later = new Date(Date.now() + 5000);
		utimesSync(path.join(outsideRoot, "index.js"), later, later);

		expect(clearStaleDepCache(site)).toBe(false);
		expect(existsSync(path.join(site, "node_modules", ".vite"))).toBe(true);

		rmSync(outsideRoot, { recursive: true, force: true });
	});

	test("does nothing outside a workspace", () => {
		const lone = path.join(root, "lone-site");
		mkdirSync(path.join(lone, "node_modules", ".vite"), { recursive: true });

		const cleared = clearStaleDepCache(lone);

		expect(cleared).toBe(false);
		expect(existsSync(path.join(lone, "node_modules", ".vite"))).toBe(true);
	});
});
