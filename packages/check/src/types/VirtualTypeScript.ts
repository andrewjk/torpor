import tsvfs from "@typescript/vfs";
import ts, { type LanguageService } from "typescript";
import type SourceMap from "./SourceMap";

export default interface VirtualTypeScript {
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
