import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import * as tsvfs from "@typescript/vfs";
import type { CompilerOptions, LanguageService } from "typescript";
import { type TextDocument } from "vscode-languageserver-textdocument";
import type SourceMap from "./SourceMap";
import { transformDocument } from "./transformDocument";
import { loadTypeScriptModule, type TypeScriptModule } from "./typescriptLoader";

export interface VTS {
	ts: TypeScriptModule;
	config: CompilerOptions;
	configPath: string | undefined;
	projectRoot: string;
	virtualFiles: Map<string, string>;
	virtualFileMaps: Map<string, { sourceFile: string; map: SourceMap[] }>;
	env: any; //tsvfs.VirtualTypeScriptEnvironment;
	lang: LanguageService;
}

let vts: VTS = {
	ts: undefined as unknown as TypeScriptModule,
	env: undefined,
	// @ts-ignore This will definitely be set
	lang: undefined,
	projectRoot: "",
	configPath: undefined,
	// This is just the default config, it should be overwritten by the one from the
	// user's tsconfig.json
	config: undefined as unknown as CompilerOptions,
	virtualFiles: new Map<string, string>(),
	virtualFileMaps: new Map<string, { sourceFile: string; map: SourceMap[] }>(),
};

type LoadResult =
	| { ok: false; errors: any[] }
	| {
			ok: true;
			filename: string;
			key: string;
			text: string;
			content: string;
			map: SourceMap[];
			vts: VTS;
	  };

export function loadDocument(document: TextDocument): LoadResult {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transformDocument(vts, filename, text);
	if (!transformed.ok) {
		return { ok: false, errors: transformed.errors };
	}

	const { content, map } = transformed;
	updateVirtualFile(key, content, filename, map);

	return { ok: true, filename, key, text, content, map, vts: vts };
}

function loadTypeScriptEnv(filename: string, key: string) {
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
		vts.projectRoot = path.join(filename, ".");
		while (vts.projectRoot && !fs.existsSync(path.join(vts.projectRoot, "node_modules"))) {
			vts.projectRoot = path.join(vts.projectRoot, "..");
		}
		if (!vts.projectRoot) {
			console.log("No project root found");
			return;
		}

		// Load the project's own TypeScript, so that language features match
		// the user's build (falls back to the bundled version)
		vts.ts = loadTypeScriptModule(filename);

		// The default config, to use if no tsconfig.json is found. It matches
		// what the compiler generates
		vts.config = {
			target: vts.ts.ScriptTarget.ES2022,
			module: vts.ts.ModuleKind.ESNext,
			moduleResolution: vts.ts.ModuleResolutionKind.Bundler,
			esModuleInterop: true,
		};

		// Maybe load tsconfig from a file
		// TODO: reload if the file is changed
		try {
			let fileConfig = loadTypeScriptConfig();
			if (fileConfig?.options) {
				vts.config = fileConfig.options;
			}
		} catch {
			console.log("No tsconfig.json file found, using default");
		}

		// Push a dummy file into the map, it will get updated shortly
		vts.virtualFiles.set(key, "const x = 5;");

		// Point the vfs at the loaded TypeScript's own lib folder. Its default
		// resolution relies on require(), which is not available in an ES module
		const tsLibDirectory = path.dirname(vts.ts.sys.getExecutingFilePath());

		const system = tsvfs.createFSBackedSystem(
			vts.virtualFiles,
			vts.projectRoot,
			vts.ts,
			tsLibDirectory,
		);
		vts.env = tsvfs.createVirtualTypeScriptEnvironment(system, [key], vts.ts, vts.config);
		vts.lang = vts.env.languageService as LanguageService;

		console.log("Torpor type checking loaded");
	}
}

function updateVirtualFile(key: string, content: string, sourceFile: string, map: SourceMap[]) {
	if (!vts.virtualFiles.has(key)) {
		vts.env.createFile(key, content);
	} else {
		vts.env.updateFile(key, content);
	}
	vts.virtualFiles.set(key, content);
	vts.virtualFileMaps.set(key, { sourceFile, map });
}

function loadTypeScriptConfig(): Record<string, any> | undefined {
	const ts = vts.ts;
	const configFileName = ts.findConfigFile(vts.projectRoot, (path) => ts.sys.fileExists(path));
	if (configFileName) {
		vts.configPath = path.dirname(configFileName);
		const configFile = ts.readConfigFile(configFileName, (path) => ts.sys.readFile(path));
		return ts.parseJsonConfigFileContent(configFile.config, ts.sys, vts.projectRoot);
	}
}

/*
function walk(folder: string, out: string[]) {
	for (let file of fs.readdirSync(folder, { withFileTypes: true })) {
		const filename = path.join(folder, file.name);
		if (file.isDirectory()) {
			if (!file.name.startsWith("node_modules")) {
				walk(filename, out);
			}
		} else {
			let extname = path.extname(file.name);
			if (extname !== ".torp") {
				continue;
			}
			out.push(filename);
		}
	}
}
*/
