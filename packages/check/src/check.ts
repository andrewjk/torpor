import tsvfs from "@typescript/vfs";
import chalk from "chalk";
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { loadDocument } from "./loadDocument";
import loadVts from "./loadVts";
import processErrors from "./processErrors";
import type Diagnostic from "./types/Diagnostic";

export default function check(folder: string): Diagnostic[] {
	if (!fs.existsSync(folder)) {
		folder = path.join(process.cwd(), folder);
	}
	console.log("Checking files in", folder);

	const vts = loadVts(folder);
	if (vts === undefined) {
		return [];
	}

	// Convert tsconfig includes and excludes to globs
	let pathToGlob = (f: string) => {
		f = fg.convertPathToPattern(f).replaceAll("\\*", "*");
		if (!f.includes("*")) {
			if (!f.endsWith("/")) f += "/";
			f += "**";
		}
		return f;
	};
	let include = vts.config.include.map(pathToGlob);
	if (include.length === 0) {
		include.push("**");
	}
	const ignore = vts.config.exclude.map(pathToGlob);

	// Get the included files with supported extensions
	let files: string[] = fg
		.globSync(include, { cwd: folder, ignore })
		.filter((f) => f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".torp"));
	console.log(`Found ${chalk.green(files.length)} file${files.length === 1 ? "" : "s"} to check`);

	let errors: Diagnostic[] = [];

	// Transform files and gather transform errors
	for (let file of files) {
		file = path.join(folder, file);
		const loaded = loadDocument(file);
		if (!loaded.ok) {
			errors.push(...loaded.errors);
		}
	}

	// Build the typescript program with all compiling files
	const host = tsvfs.createVirtualCompilerHost(vts.env.sys, vts.config.options, ts);
	const program = ts.createProgram({
		rootNames: [...vts.virtualFiles.keys()],
		options: vts.config.options,
		host: host.compilerHost,
	});

	// Get typescript to check the compiled files
	const compileErrors = program
		.getSemanticDiagnostics()
		.concat(program.getDeclarationDiagnostics())
		.concat(program.getConfigFileParsingDiagnostics())
		.concat(program.getGlobalDiagnostics())
		.concat(program.getOptionsDiagnostics())
		.concat(program.getSyntacticDiagnostics());
	errors.push(...processErrors(vts, compileErrors));

	return errors;
}
