import { createRequire } from "node:module";
import path from "node:path";
import type TS from "typescript";

export type TypeScriptModule = typeof TS;

/**
 * Checks that a TypeScript module provides the API surface that the check
 * pipeline uses. Newer versions of TypeScript may drop or change the compiler
 * API (e.g. the TypeScript 7 native package does not expose the compiler
 * enums), in which case the version bundled with this package is used instead.
 */
function isCompatible(ts: TypeScriptModule): boolean {
	const api = ts as unknown as Record<string, any> | undefined;
	return (
		!!api &&
		typeof api.version === "string" &&
		typeof api.createProgram === "function" &&
		typeof api.createLanguageService === "function" &&
		!!api.sys &&
		typeof api.sys.getExecutingFilePath === "function" &&
		!!api.ScriptTarget &&
		!!api.ModuleKind &&
		!!api.ModuleResolutionKind
	);
}

/**
 * Loads the TypeScript module to check a project with.
 *
 * Prefers the project's own installed version (resolved from the project
 * root, like Node would), so that diagnostics match the user's build.
 * TypeScript 7 (the native package) doesn't expose the compiler API that the
 * check needs, and a project may not have TypeScript installed at all, so it
 * falls back to the version bundled with this package.
 */
export default function loadTypeScriptModule(projectRoot: string): TypeScriptModule {
	try {
		const require = createRequire(path.join(projectRoot, "package.json"));
		const ts = require("typescript") as TypeScriptModule;
		if (isCompatible(ts)) {
			console.log(`Using TypeScript ${ts.version} from the project`);
			return ts;
		}
		console.log(
			`Project TypeScript ${ts.version} does not provide the compiler API, ` +
				`falling back to the bundled version`,
		);
	} catch {
		// The project does not have TypeScript installed
	}

	const require = createRequire(import.meta.url);
	const ts = require("typescript") as TypeScriptModule;
	console.log(`Using bundled TypeScript ${ts.version}`);
	return ts;
}
