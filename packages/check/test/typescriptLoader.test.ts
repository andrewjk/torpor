import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import loadTypeScriptModule from "../src/typescriptLoader";

test("uses the project's TypeScript when it provides the compiler API", () => {
	const ts = loadTypeScriptModule(path.join(__dirname, ".."));

	// The compiler surface the check pipeline needs (the enums and factories
	// that TypeScript 7's native package doesn't expose)
	expect(typeof ts.version).toBe("string");
	expect(ts.ScriptTarget.ES2022).toBeDefined();
	expect(ts.ModuleKind.ESNext).toBeDefined();
	expect(ts.ModuleResolutionKind.Bundler).toBeDefined();
	expect(typeof ts.createProgram).toBe("function");
	expect(typeof ts.createLanguageService).toBe("function");
});

test("falls back to the bundled TypeScript when the project has none", () => {
	// A folder outside any node_modules tree, so resolving the project's
	// TypeScript fails and the package's own version is used
	const empty = fs.mkdtempSync(path.join(os.tmpdir(), "torpor-check-"));
	try {
		const ts = loadTypeScriptModule(empty);
		expect(typeof ts.version).toBe("string");
		expect(ts.ScriptTarget.ES2022).toBeDefined();
	} finally {
		fs.rmSync(empty, { recursive: true, force: true });
	}
});
