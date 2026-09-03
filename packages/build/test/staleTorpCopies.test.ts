import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { reportStaleTorpCopies } from "../src/run/staleTorpCopies";

let root = "";

beforeAll(() => {
	root = realpathSync(mkdtempSync(path.join(tmpdir(), "torpor-stale-torp-")));

	// A minimal pnpm-style monorepo:
	//   /pnpm-workspace.yaml
	//   /site (depends on fresh-pkg and stale-pkg, symlinked like workspace deps)
	//   /packages/fresh-pkg  -- src and dist .torp copies match
	//   /packages/stale-pkg  -- dist .torp copies are stale
	const site = path.join(root, "site");
	mkdirSync(site, { recursive: true });
	writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - '*'\n");
	writeFileSync(
		path.join(site, "package.json"),
		JSON.stringify({
			name: "test-site",
			dependencies: { "fresh-pkg": "*", "stale-pkg": "*", "not-in-workspace": "*" },
		}),
	);

	for (const name of ["fresh-pkg", "stale-pkg"]) {
		const pkgDir = path.join(root, "packages", name);
		mkdirSync(pkgDir, { recursive: true });
		mkdirSync(path.join(site, "node_modules"), { recursive: true });
		symlinkSync(pkgDir, path.join(site, "node_modules", name), "dir");
	}

	writePackage(path.join(root, "packages", "fresh-pkg"), {
		"src/One.torp": "one",
		"dist/One.torp": "one",
	});
	writePackage(path.join(root, "packages", "stale-pkg"), {
		// Matches
		"src/Kept.torp": "kept",
		"dist/Kept.torp": "kept",
		// Src changed without a rebuild
		"src/Changed.torp": "new content",
		"dist/Changed.torp": "old content",
		// New component, never built
		"src/Added.torp": "added",
		// Removed component, still in dist
		"dist/Removed.torp": "removed",
	});
});

afterAll(() => {
	if (root) rmSync(root, { recursive: true, force: true });
});

function writePackage(dir: string, files: Record<string, string>): void {
	mkdirSync(dir, { recursive: true });
	writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: path.basename(dir) }));
	for (const [file, content] of Object.entries(files)) {
		const full = path.join(dir, file);
		mkdirSync(path.dirname(full), { recursive: true });
		writeFileSync(full, content);
	}
}

function report(siteRoot: string): string[] {
	const messages: string[] = [];
	reportStaleTorpCopies(siteRoot, (message) => messages.push(message));
	return messages;
}

describe("reportStaleTorpCopies", () => {
	test("reports changed, missing and leftover dist .torp copies", () => {
		const messages = report(path.join(root, "site"));

		expect(messages.length).toBe(1);
		expect(messages[0]).toContain("stale-pkg's dist .torp copies are stale");
		expect(messages[0]).toContain("Changed.torp (differs from src)");
		expect(messages[0]).toContain("Added.torp (not copied to dist)");
		expect(messages[0]).toContain("Removed.torp (left over in dist, no src file)");
		// Rebuild hint names the package folder relative to the workspace root
		expect(messages[0]).toContain(path.join("packages", "stale-pkg"));
	});

	test("does not report packages whose dist copies match src", () => {
		const messages = report(path.join(root, "site"));

		expect(messages.join("\n")).not.toContain("fresh-pkg");
	});

	test("ignores dependencies that resolve outside the workspace", () => {
		// `not-in-workspace` isn't installed at all, so it can't resolve and
		// must be skipped without throwing
		const messages = report(path.join(root, "site"));
		expect(messages.length).toBe(1);
	});

	test("does nothing for a plain (non-workspace) site folder", () => {
		// No pnpm-workspace.yaml / workspaces field above this folder
		const standalone = path.join(root, "standalone");
		mkdirSync(standalone, { recursive: true });
		writeFileSync(
			path.join(standalone, "package.json"),
			JSON.stringify({ name: "standalone", dependencies: { "stale-pkg": "*" } }),
		);

		expect(report(standalone)).toEqual([]);
	});

	test("never throws for a folder without a package.json", () => {
		const empty = path.join(root, "empty");
		mkdirSync(empty, { recursive: true });
		expect(report(empty)).toEqual([]);
	});
});
