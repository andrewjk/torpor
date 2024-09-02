import { trimQuotes, trimStartAndEnd } from "../utils";
import type ParseStatus from "./ParseStatus";
import parseChildTemplate from "./parseChildTemplate";
import parseDocs from "./parseDocs";
import parseElement from "./parseElement";
import parseStyleElement from "./parseStyles";
import parseTag from "./parseTag";
import { accept, addError } from "./parseUtils";

export default function parseMarkup(status: ParseStatus, source: string) {
	// HACK: The laziest way to handle elses etc:
	status.source = status.source
		.replace(/}(\s*)else/g, "}$1@else")
		.replace(/(\{|\})(\s*)case/g, "$1$2@case")
		.replace(/(\{|\})(\s*)default/g, "$1$2@default")
		.replace(/{(\s*)key/g, "{$1@key")
		.replace(/}(\s*)then/g, "}$1@then")
		.replace(/}(\s*)catch/g, "}$1@catch");

	for (status.i; status.i < source.length; status.i++) {
		const char = status.source[status.i];
		if (char === "<") {
			if (
				status.source[status.i + 1] === "!" &&
				status.source[status.i + 2] === "-" &&
				status.source[status.i + 3] === "-"
			) {
				// It's a comment, swallow it
				status.i = status.source.indexOf("-->", status.i) + 3;
			} else {
				parseTopElement(status);
			}
			// HACK: Go back 1 char so it can be incremented by the loop
			// TODO: Really need to fix loops
			status.i -= 1;
		} else if (accept("/**", status)) {
			status.i -= 1;
			status.docs = parseDocs(status);
		}
	}
}

function parseTopElement(status: ParseStatus) {
	const start = status.i;
	const element = parseTag(status);
	switch (element.tagName) {
		case "script": {
			if (!element.selfClosed) {
				status.script = extractElementText("script", status);

				// HACK: un-replace the hacky things we replaced at the top of this file
				status.script = status.script
					.replaceAll("@else", "else")
					.replaceAll("@case", "case")
					.replaceAll("@default", "default")
					.replaceAll("@key", "key")
					.replaceAll("@then", "then")
					.replaceAll("@catch", "catch");

				extractScriptImports(status);
			}
			break;
		}
		case "style": {
			if (!element.selfClosed) {
				status.style = parseStyleElement(status);
			}
			break;
		}
		case "template": {
			if (!element.selfClosed) {
				const source = extractElementText("template", status);
				const childName = trimQuotes(
					element.attributes.find((a) => a.name === "name")?.value || "ChildComponent",
				);
				parseChildTemplate(childName, source, status);
			}
			break;
		}
		default: {
			if (status.template === undefined) {
				// Rewind to the start of the element
				status.i = start;
				status.template = parseElement(status);
			} else {
				addError(status, `Multiple top-level elements: ${element.tagName}`, start);
			}
			break;
		}
	}
}

function extractElementText(tagName: string, status: ParseStatus): string {
	const start = status.i;
	const closeTag = `</${tagName}>`;
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (
			char === "<" &&
			status.source.substring(status.i, status.i + closeTag.length) === closeTag
		) {
			// Return on </script>
			const result = status.source.substring(start, status.i).trim();
			status.i += closeTag.length - 1;
			return result;
		} else if (char === '"' || char === "'" || char === "`") {
			// Ignore the content of strings
			status.i += 1;
			for (status.i; status.i < status.source.length; status.i++) {
				if (status.source[status.i] === char && status.source[status.i - 1] !== "\\") {
					break;
				}
			}
		} else if (char === "/") {
			const nextChar = status.source[status.i + 1];
			if (nextChar === "/") {
				// Ignore the content of one-line comments
				status.i += 2;
				for (status.i; status.i < status.source.length; status.i++) {
					if (status.source[status.i] === "\n") {
						break;
					}
				}
			} else if (nextChar === "*") {
				// Ignore the content of multiple-line comments
				status.i += 2;
				for (status.i; status.i < status.source.length; status.i++) {
					if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
						break;
					}
				}
			}
		}
	}
	addError(status, `Unclosed ${tagName} element`, start);
	return "";
}

function extractScriptImports(status: ParseStatus) {
	if (status.script) {
		let start = 0;
		let braceLevel = 0;
		for (let i = 0; i < status.script.length + 1; i++) {
			// HACK: Really need to properly parse imports
			if (status.script[i] === "{") {
				braceLevel += 1;
			} else if (status.script[i] === "}") {
				braceLevel -= 1;
			}
			if ((status.script[i] === "\n" && braceLevel === 0) || status.script[i] === undefined) {
				const line = status.script.substring(start, i).trim();
				if (line.length) {
					if (line.startsWith("//")) {
						// TODO: More comment handling
					} else if (line.startsWith("import ")) {
						// TODO: More import wrangling
						// (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
						status.imports ||= [];
						const importRegex = /import\s+(.+?)\s+from\s+([^;\n]+)/gms;
						const componentRegex = /\.tera$/gm;
						const importMatches = line.matchAll(importRegex);
						for (let match of importMatches) {
							const importName = match[1];
							const path = trimQuotes(match[2]);
							const component = componentRegex.test(path);
							let nonDefault = false;
							for (let name of importName.split(/\s*,\s*/)) {
								if (name.startsWith("{")) {
									nonDefault = true;
								}
								const nameParts = name.split(/\bas\b/);
								let newImport = {
									name: nameParts[0].trim(),
									alias: nameParts[1]?.trim(),
									path,
									nonDefault,
									component,
								};
								if (newImport.name) {
									newImport.name = trimStartAndEnd(newImport.name, "{", "}").trim();
								}
								if (newImport.alias) {
									newImport.alias = trimStartAndEnd(newImport.alias, "{", "}").trim();
								}
								status.imports.push(newImport);
								if (name.endsWith("}")) {
									nonDefault = false;
								}
							}
						}
					} else {
						// Imports are done!
						// TODO: Make sure there aren't any more with a regex
						break;
					}
				}
				start = i + 1;
			}
		}
		if (status.imports) {
			status.script = status.script.substring(start).trim();
		}
	}
}
