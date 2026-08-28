import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { loadTypeScriptModule } from "../src/script/typescriptLoader";

const tempFolders: string[] = [];

function createProject(): string {
	const folder = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "torpor-lsp-")));
	tempFolders.push(folder);
	return folder;
}

afterAll(() => {
	for (const folder of tempFolders) {
		fs.rmSync(folder, { recursive: true, force: true });
	}
});

describe("typescript loader", () => {
	it("loads the project's own TypeScript", () => {
		const project = createProject();
		const tsFolder = path.join(project, "node_modules/typescript");
		fs.mkdirSync(tsFolder, { recursive: true });
		fs.writeFileSync(
			path.join(tsFolder, "package.json"),
			JSON.stringify({ name: "typescript", version: "9.9.9", main: "index.js" }),
		);
		fs.writeFileSync(
			path.join(tsFolder, "index.js"),
			[
				"module.exports = {",
				"\tversion: '9.9.9',",
				"\tisFixture: true,",
				"\tcreateLanguageService: () => ({}),",
				"\tsys: { getExecutingFilePath: () => '' },",
				"\tScriptTarget: {},",
				"\tModuleKind: {},",
				"\tModuleResolutionKind: {},",
				"\tSemanticClassificationFormat: {},",
				"};",
			].join("\n"),
		);

		const ts = loadTypeScriptModule(path.join(project, "App.torp"));

		expect((ts as { isFixture?: boolean }).isFixture).toBe(true);
	});

	it("falls back when the project's TypeScript is not compatible", () => {
		const project = createProject();
		const tsFolder = path.join(project, "node_modules/typescript");
		fs.mkdirSync(tsFolder, { recursive: true });
		fs.writeFileSync(
			path.join(tsFolder, "package.json"),
			JSON.stringify({ name: "typescript", version: "9.9.9", main: "index.js" }),
		);
		fs.writeFileSync(path.join(tsFolder, "index.js"), `module.exports = { version: '9.9.9' };`);

		const ts = loadTypeScriptModule(path.join(project, "App.torp"));

		expect(ts.version).toMatch(/^\d+\.\d+\.\d+$/);
		expect((ts as { version: string }).version).not.toBe("9.9.9");
	});

	it("falls back to the bundled TypeScript", () => {
		const project = createProject();

		const ts = loadTypeScriptModule(path.join(project, "App.torp"));

		expect(ts.version).toMatch(/^\d+\.\d+\.\d+$/);
	});
});
