import type tsvfs from "@typescript/vfs";
import type ts from "typescript";
import type { LanguageService } from "typescript";
import type { TypeScriptModule } from "../typescriptLoader";
import type SourceMap from "./SourceMap";

export default interface VirtualTypeScript {
	// The TypeScript module the project is checked with: the project's own
	// version when it provides the compiler API, otherwise the one bundled
	// with this package (set by loadVts)
	ts: TypeScriptModule;
	config: {
		options: ts.CompilerOptions;
		include: string[];
		exclude: string[];
	};
	configPath: string | undefined;
	projectRoot: string;
	// TODO: Merge these??
	virtualFiles: Map<string, string>;
	virtualFileMaps: Map<string, { sourceFile: string; map: SourceMap[] }>;
	env: tsvfs.VirtualTypeScriptEnvironment;
	lang: LanguageService;
}
