import fs from "node:fs";
import path from "node:path";
import pathReplace from "../utils/pathReplace";
import type SourceMap from "./SourceMap";
import { type VTS } from "./loadDocument";

const torpor = require("@torpor/view/compile");
//const torpor = require("../../../../packages/view/dist/compile.mjs");

export interface TransformResult {
	ok: boolean;
	errors: any[];
	content: string;
	map: SourceMap[];
}

export function transformDocument(
	vts: VTS,
	filename: string,
	source: string,
	debug = false,
): TransformResult {
	try {
		// Build the main file as a component
		const parsed = torpor.parse(source);

		// If not ok, don't validate
		if (!parsed.ok) {
			return {
				ok: false,
				errors: parsed.errors,
				content: "",
				map: [],
			};
		}

		let { code, map } = torpor.build(parsed.template, { mapped: true });

		code = importComponentFiles(vts, filename, code, map, debug);

		//console.log(code);
		//console.log(map);

		return {
			ok: true,
			errors: [],
			content: code,
			map,
		};
	} catch (ex) {
		console.log("Failed to compile", source);
		console.log(ex);
		return {
			ok: false,
			errors: [],
			content: "",
			map: [],
		};
	}
}

function importComponentFiles(
	vts: VTS,
	filename: string,
	content: string,
	map: SourceMap[],
	_debug = false,
): string {
	if (!/^\s*import\s+(.+?)\s+from\s+(.+?);*\s*$/ms.test(content)) {
		return content;
	}

	// Build imported component files and add them to the virtual file map
	// TODO: Handle files from node_modules? Might get done automatically by typescript-vfs

	// HACK: We're assuming that all imports are at the top of the file, and
	// that there are not multiple imports on the one line
	const first = map.shift()!;
	const filepath = path.dirname(filename);

	let moved = 0;
	let newMaps: SourceMap[] = [];

	for (let i = 0; i < first.script.length; i++) {
		if (first.script[i] === "/") {
			// Skip comments
			if (first.script[i + 1] === "/") {
				i = first.script.indexOf("\n", i);
			} else if (first.script[i + 1] === "*") {
				i = first.script.indexOf("*/", i);
			}
			if (i === -1) {
				return content;
			}
		} else if (first.script[i] === "i") {
			const match = first.script.substring(i).match(/import\s+(.+?)\s+from\s+(.+?);*\s*$/ms);
			if (match === null) continue;

			const oldImport = match[0];
			//const names = match[1];
			const importedFile = match[2];

			// Strip quotes
			let importFile = importedFile;
			if (
				(importFile.startsWith("'") && importFile.endsWith("'")) ||
				(importFile.startsWith('"') && importFile.endsWith('"'))
			) {
				importFile = importFile.substring(1, importFile.length - 1);
			}

			// Just map import files that aren't components
			if (!importFile.endsWith(".torp")) {
				newMaps.push({
					script: oldImport,
					source: {
						start: i,
						end: i + oldImport.length,
					},
					compiled: {
						start: first.compiled.start + i + moved,
						end: first.compiled.start + i + moved + oldImport.length,
					},
				});
				continue;
			}

			// Get the absolute path of the import file
			let typeFile = importFile.startsWith(".") ? path.join(filepath, importFile) : importFile;

			// Replace aliased paths from tsconfig.json
			if (vts.configPath && vts.config.paths) {
				// HACK: Get the longest match etc
				const oldTypeFile = typeFile;
				for (let [srcGlob, paths] of Object.entries(vts.config.paths)) {
					for (let destGlob of paths) {
						typeFile = pathReplace(srcGlob, destGlob, typeFile);
					}
				}
				// The import may now be relative to the tsconfig file, so make it absolute
				if (typeFile !== oldTypeFile && typeFile.startsWith(".")) {
					typeFile = path.join(vts.configPath, typeFile);
				}
			}

			// Create the virtual file for the component
			if (!vts.virtualFiles.has(typeFile) && fs.existsSync(typeFile)) {
				const typeSource = fs.readFileSync(typeFile, "utf8");
				const { content } = transformDocument(vts, typeFile, typeSource);
				const key = typeFile.replace(/\.torp$/, ".ts");
				vts.virtualFiles.set(key, content);
				vts.env.createFile(key, content);
			}

			// Replace the import file with the virtual file
			let oldLength = content.length;
			let newValue = typeFile.replace(".torp", ".ts");
			// HACK: We could concat this if we could be bothered
			let newImport = oldImport.replace(importFile, newValue);
			content = content.replace(oldImport, newImport);

			// Move subsequent ranges around
			let diff = content.length - oldLength;
			for (let mapped of map) {
				mapped.compiled.start += diff;
				mapped.compiled.end += diff;
			}

			// Add a range for the changed import
			newMaps.push({
				script: oldImport,
				source: {
					start: i,
					end: i + oldImport.length,
				},
				compiled: {
					start: first.compiled.start + i + moved,
					end: first.compiled.start + i + moved + newImport.length,
				},
			});

			moved += diff;
			i += oldImport.length;
		}
	}

	map.unshift(...newMaps);

	return content;
}
