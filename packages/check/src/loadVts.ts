import tsvfs from "@typescript/vfs";
import fs from "node:fs";
import path from "path";
import ts, { type LanguageService } from "typescript";
import type SourceMap from "./types/SourceMap";
import type VirtualTypeScript from "./types/VirtualTypeScript";

let vts: VirtualTypeScript = {
	// @ts-ignore This will definitely be set
	env: undefined,
	// @ts-ignore This will definitely be set
	lang: undefined,
	projectRoot: "",
	configPath: undefined,
	// This is just the default config, it should be overwritten by the one from
	// the user's tsconfig.json
	config: {
		options: {
			target: ts.ScriptTarget.ES2022,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			esModuleInterop: true,
		},
		include: [],
		exclude: [],
	},
	virtualFiles: new Map<string, string>(),
	virtualFileMaps: new Map<string, { sourceFile: string; map: SourceMap[] }>(),
};

export default function loadVts(vtsPath: string): VirtualTypeScript | undefined {
	if (vts.env === undefined) {
		// If using imports where the types don't directly match up to
		// their FS representation (like the imports for node) then use
		// triple-slash directives to make sure globals are set up
		// first.
		//const content = `
		//	/// <reference types="node" />
		//	import * as path from 'path';
		//	path.`.replaceAll(/\s+/, " ").trim();

		// By providing a project root, the system knows how to resolve
		// node_modules correctly
		vts.projectRoot = path.join(vtsPath, ".");
		while (vts.projectRoot && !fs.existsSync(path.join(vts.projectRoot, "node_modules"))) {
			vts.projectRoot = path.join(vts.projectRoot, "..");
		}
		if (!vts.projectRoot) {
			console.log("No project root found");
			return;
		}

		// Maybe load tsconfig from a file
		// TODO: reload if the file is changed
		try {
			let fileConfig = loadTypeScriptConfig();
			if (fileConfig?.options) {
				vts.config = {
					options: fileConfig.options,
					include: fileConfig.raw.include ?? [],
					exclude: fileConfig.raw.exclude ?? [],
				};
			}
		} catch {
			console.log("No tsconfig.json file found, using default");
		}

		const system = tsvfs.createFSBackedSystem(vts.virtualFiles, vts.projectRoot, ts);
		vts.env = tsvfs.createVirtualTypeScriptEnvironment(system, [], ts, vts.config.options);
		vts.lang = vts.env.languageService as LanguageService;

		console.log("Torpor type checking loaded");
	}
	return vts;
}

function loadTypeScriptConfig(): Record<string, any> | undefined {
	const configFileName = ts.findConfigFile(vts.projectRoot, ts.sys.fileExists);
	if (configFileName) {
		vts.configPath = path.dirname(configFileName);
		const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
		return ts.parseJsonConfigFileContent(configFile.config, ts.sys, vts.projectRoot);
	}
}
