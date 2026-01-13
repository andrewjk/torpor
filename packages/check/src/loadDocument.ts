import fs from "node:fs";
import loadVts from "./loadVts";
import transformDocument from "./transformDocument";
import type Diagnostic from "./types/Diagnostic";
import type SourceMap from "./types/SourceMap";
import type VirtualTypeScript from "./types/VirtualTypeScript";

type LoadResult =
	| { ok: false; errors: Diagnostic[] }
	| {
			ok: true;
			filename: string;
			key: string;
			text: string;
			content: string;
			map: SourceMap[];
			vts: VirtualTypeScript;
	  };

export function loadDocument(filename: string): LoadResult {
	const key = filename.replace(/\.torp$/, ".ts");

	const vts = loadVts(filename);
	if (vts === undefined) {
		return { ok: false, errors: [] };
	}

	const text = fs.readFileSync(filename, "utf-8");
	if (filename.endsWith(".torp")) {
		const transformed = transformDocument(vts, filename, text);
		if (!transformed.ok) {
			return {
				ok: false,
				errors: transformed.errors,
			};
		}
		const { content, map } = transformed;
		updateVirtualFile(vts, key, content, filename, map);
		return { ok: true, filename, key, text, content, map, vts: vts };
	} else {
		updateVirtualFile(vts, key, text, filename, []);
		return { ok: true, filename, key, text, content: text, map: [], vts: vts };
	}
}

function updateVirtualFile(
	vts: VirtualTypeScript,
	key: string,
	content: string,
	sourceFile: string,
	map: SourceMap[],
) {
	if (!vts.virtualFiles.has(key)) {
		vts.env.createFile(key, content);
	} else {
		vts.env.updateFile(key, content);
	}
	vts.virtualFiles.set(key, content);
	vts.virtualFileMaps.set(key, { sourceFile, map });
}
