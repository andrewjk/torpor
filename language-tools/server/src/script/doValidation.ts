import ts, { type DiagnosticMessageChain } from "typescript";
import { type Diagnostic } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import { loadDocument } from "./loadDocument";

export default function doValidation(document: TextDocument) {
	const transformed = loadDocument(document);
	if (!transformed.ok) {
		// If there were parse or build errors, return them immediately
		// TODO: Do we want to clear the virtual file??
		if (!transformed.ok) {
			return transformed.errors.map((e: any) => {
				return {
					message: e.message,
					range: {
						start: { line: e.startLine, character: e.startChar },
						end: { line: e.endLine, character: e.endChar },
					},
				} satisfies Diagnostic;
			});
		}
	}
	const { key, text, content, map, vts } = transformed;

	//console.log(content);
	//console.log(map);

	// HACK: Is this ok to do every check? We're doing it because otherwise
	// changes to linked files (e.g. adding or removing a field in an interface)
	// don't get picked up. But doing it here also means that it only happens
	// when the file is edited...
	vts.lang.cleanupSemanticCache();

	const diagnostics = [
		...vts.lang.getSemanticDiagnostics(key),
		...vts.lang.getSyntacticDiagnostics(key),
	]
		.map((d: ts.Diagnostic) => {
			// Find the mapping between source and compiled, if it exists. If it
			// doesn't exist, the error must be in non-user code. Not great, but
			// the user doesn't need to know about it
			let start = d.start ?? 0;
			let end = (d.start ?? 0) + (d.length ?? 0);
			let mapped = map.find((m: any) => start >= m.compiled.start && end <= m.compiled.end);

			let message = getMessageText(d);

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

			if (!mapped && message !== "!") {
				// Log it for diagnostics
				console.log(`Error${!mapped ? " (unmapped)" : ""}:`, message);
				// @ts-ignore we know this exists
				const lineMap: number[] = d.file?.lineMap;
				if (lineMap) {
					const line = (lineMap.findIndex((l: number) => l > start) ?? 1) - 1;
					const char = start - lineMap[line];
					console.log(`(${line + 1}, ${char + 1}):`, content.split("\n")[line]);
				}
			}

			// HACK: Couldn't map back to the source, so just display it at the
			// first character
			if (!mapped) {
				return {
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
				if (text[i] === "\n") {
					lastLineStart = i;
					startLine++;
				}
			}
			let startChar = sourceStart - lastLineStart - 1;
			let endLine = startLine;
			for (let i = sourceStart; i < sourceEnd; i++) {
				if (text[i] === "\n") {
					lastLineStart = i;
					endLine++;
				}
			}
			let endChar = sourceEnd - lastLineStart - 1;

			return {
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
				code: d.code,
				message,
			} satisfies Diagnostic;
		})
		.filter((d) => d.message !== "!");

	return diagnostics;
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
