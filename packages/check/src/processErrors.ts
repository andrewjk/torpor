import fs from "node:fs";
import ts, { type DiagnosticMessageChain } from "typescript";
import type Diagnostic from "./types/Diagnostic";
import type SourceMap from "./types/SourceMap";
import type VirtualTypeScript from "./types/VirtualTypeScript";

export default function processErrors(
	vts: VirtualTypeScript,
	errors: ts.Diagnostic[],
): Diagnostic[] {
	return errors
		.map((d: ts.Diagnostic) => {
			let message = getMessageText(d);

			if (d.file === undefined) {
				return {
					path: "",
					message,
					range: {
						start: { line: 0, character: 0 },
						end: { line: 0, character: 0 },
					},
				};
			}

			let filename = d.file.fileName;
			let map: SourceMap[] = [];
			if (vts.virtualFileMaps.has(filename)) {
				let transformed = vts.virtualFileMaps.get(filename)!;
				filename = transformed.sourceFile;
				map = transformed.map;
			}
			const source = fs.readFileSync(filename, "utf-8");
			let lineText: string | undefined;
			if (!filename.endsWith(".torp")) {
				let start = { line: 0, character: 0 };
				let end = { line: 0, character: 0 };
				if (d.start !== undefined) {
					// @ts-ignore we know this exists
					let lineMap: number[] = d.file.lineMap;
					if (lineMap === undefined) {
						lineMap = [0];
						for (let i = 0; i < source.length; i++) {
							if (source[i] === "\n") lineMap.push(i);
						}
					}
					// TODO: These need to be indexes
					start.line = (lineMap.findIndex((l: number) => l > d.start!) ?? 1) - 1;
					start.character = d.start - lineMap[start.line] - 1;
					let endx = d.start! + (d.length ?? 0);
					end.line = (lineMap.findIndex((l: number) => l >= endx) ?? 1) - 1;
					end.character = endx - lineMap[end.line] - 1;
					let lineStart = lineMap[start.line] + 1;
					let lineEnd = lineMap[start.line + 1];
					lineText = source.substring(lineStart, lineEnd);
				}
				return {
					path: filename,
					message,
					range: { start, end },
					lineText,
				} satisfies Diagnostic;
			}

			// Find the mapping between source and compiled, if it exists. If it
			// doesn't exist, the error must be in non-user code. Not great, but
			// the user doesn't need to know about it
			let start = d.start ?? 0;
			let end = (d.start ?? 0) + (d.length ?? 0);
			let mapped = map.find((m: any) => start >= m.compiled.start && end <= m.compiled.end);

			// HACK: We don't care about these? Maybe there's a better way to
			// ignore/fix them
			if (
				message.startsWith("This import uses a '.ts' extension to resolve") ||
				/Cannot find module '(.+?)\?raw'/.test(message)
			) {
				mapped = undefined;
				// This special message will be filtered out
				message = "!";
			}

			//if (!mapped && message !== "!") {
			//	// Log it for diagnostics
			//	console.log(`Error${!mapped ? " (unmapped)" : ""}:`, message);
			//	// @ts-ignore we know this exists
			//	const lineMap: number[] = d.file?.lineMap;
			//	if (lineMap) {
			//		const line = (lineMap.findIndex((l: number) => l > start) ?? 1) - 1;
			//		const char = start - lineMap[line];
			//		console.log(`(${line + 1}, ${char + 1}):`, content.split("\n")[line]);
			//	}
			//}

			// HACK: Couldn't map back to the source, so just display it at the
			// first character
			if (!mapped) {
				return {
					path: filename,
					message,
					range: {
						start: { line: 0, character: 0 },
						end: { line: 0, character: 0 },
					},
				} satisfies Diagnostic;
			}

			// We have the mapping, so we know roughly where in the
			// source the error occurs, but now we need to narrow it
			// down to the exact location
			let sourceStart = mapped.source.start + start - mapped.compiled.start;
			let sourceEnd = mapped.source.start + end - mapped.compiled.start;
			// HACK: If the translated mapping is outside of the source mapping,
			// just highlight the source mapping. It won't be 100% accurate, but
			// better than showing it way off in the middle of nowhere. This
			// happens e.g. when the $props are bad (as `<Component>` maps to
			// something like `Component($parent, $anchor, $props)`
			if (sourceStart > mapped.source.end) {
				sourceStart = mapped.source.start;
				sourceEnd = mapped.source.end;
			}
			// Same thing for if the error extends too far
			if (sourceEnd > mapped.source.end) {
				sourceEnd = mapped.source.end;
			}

			// TODO: Store this, so we don't need to start from 0 every time
			let lastLineStart = 0;
			let startLine = 0;
			for (let i = 0; i < sourceStart; i++) {
				if (source[i] === "\n") {
					lastLineStart = i + 1;
					startLine++;
				}
			}
			let startChar = sourceStart - lastLineStart; /*- 1*/

			let lastLineEnd: number | undefined = source.indexOf("\n", lastLineStart + 1);
			if (lastLineEnd === -1) lastLineEnd = undefined;
			lineText = source.substring(lastLineStart, lastLineEnd);

			let endLine = startLine;
			for (let i = sourceStart; i < sourceEnd; i++) {
				if (source[i] === "\n") {
					lastLineStart = i;
					endLine++;
				}
			}
			let endChar = sourceEnd - lastLineStart; // - 1;

			return {
				path: filename,
				message,
				code: d.code,
				range: {
					start: {
						line: startLine,
						character: startChar,
					},
					end: {
						line: endLine,
						character: endChar,
					},
				},
				lineText,
			} satisfies Diagnostic;
		})
		.filter((d) => d.message !== "!");
}

function getMessageText(d: ts.Diagnostic): string {
	if (typeof d.messageText === "string") {
		return d.messageText;
	} else {
		let messages: string[] = [];
		getMessages(d.messageText, messages);
		return messages.map((m, i) => " ".repeat(i * 2) + m).join("\n");
	}
}

function getMessages(chain: DiagnosticMessageChain, messages: string[]) {
	messages.push(chain.messageText);
	if (chain.next !== undefined) {
		for (let next of chain.next) {
			getMessages(next, messages);
		}
	}
}
