import { createRequire } from "node:module";
import type TS from "typescript";

export type TypeScriptModule = typeof TS;

/**
 * Checks that a TypeScript module provides the API surface that the language
 * server uses. Newer versions of TypeScript may drop or change the compiler
 * internals (e.g. the TypeScript 7 native preview does not expose the
 * compiler enums), in which case the bundled version is used instead
 */
function isCompatible(ts: TypeScriptModule): boolean {
	const api = ts as unknown as Record<string, any> | undefined;
	return (
		!!api &&
		typeof api.version === "string" &&
		typeof api.createLanguageService === "function" &&
		!!api.sys &&
		typeof api.sys.getExecutingFilePath === "function" &&
		!!api.ScriptTarget &&
		!!api.ModuleKind &&
		!!api.ModuleResolutionKind &&
		!!api.SemanticClassificationFormat
	);
}

/**
 * Loads the TypeScript module to use for the project containing the given
 * file.
 *
 * Prefers the project's own installed version (resolved from the file's
 * location, like Node would), so that language features match the user's
 * build. Falls back to the version bundled with this package.
 */
export function loadTypeScriptModule(filename: string): TypeScriptModule {
	try {
		const ts = createRequire(filename)("typescript") as TypeScriptModule;
		if (isCompatible(ts)) {
			console.log(`Using TypeScript ${ts.version} from the project`);
			return ts;
		}
		console.log(
			`Project TypeScript ${ts.version} is not compatible with the language server, falling back to the bundled version`,
		);
	} catch {
		// The project does not have TypeScript installed
	}
	// When bundled for VS Code the module runs as CommonJS, so resolve from
	// __filename; when running as an ES module, resolve from the module URL
	const base = typeof __filename === "string" ? __filename : import.meta.url;
	const ts = createRequire(base)("typescript") as TypeScriptModule;
	console.log(`Using bundled TypeScript ${ts.version}`);
	return ts;
}
