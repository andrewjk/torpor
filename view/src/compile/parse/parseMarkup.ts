import trimQuotes from "../utils/trimQuotes";
import trimStartAndEnd from "../utils/trimStartAndEnd";
import type ParseStatus from "./ParseStatus";
import parseChildTemplate from "./parseChildTemplate";
import parseDocs from "./parseDocs";
import parseElement from "./parseElement";
import parseStyles from "./parseStyles";
import parseTag from "./parseTag";
import accept from "./utils/accept";
import addError from "./utils/addError";

export default function parseMarkup(status: ParseStatus, source: string) {
	while (status.i < source.length) {
		if (accept("<!--", status)) {
			// It's a comment, swallow it
			status.i = status.source.indexOf("-->", status.i) + 3;
		} else if (accept("<", status, false)) {
			parseTopElement(status);
		} else if (accept("/**", status)) {
			status.i -= 1;
			status.docs = parseDocs(status);
		} else {
			status.i += 1;
		}
	}
}

function parseTopElement(status: ParseStatus) {
	const start = status.i;
	const element = parseTag(status);
	switch (element.tagName) {
		case "script": {
			if (!element.selfClosed) {
				status.script = extractElementText("script", false, status);
				extractScriptImports(status);
			}
			break;
		}
		case "style": {
			if (!element.selfClosed) {
				let source = extractElementText("style", true, status);
				status.style = parseStyles(source, status);
			}
			break;
		}
		case "template": {
			if (!element.selfClosed) {
				const source = extractElementText("template", false, status);
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

function extractElementText(tagName: string, stripComments: boolean, status: ParseStatus): string {
	const start = status.i;
	let content = "";
	const closeTag = `</${tagName}>`;
	while (status.i < status.source.length) {
		if (accept(closeTag, status)) {
			return content.trim();
		} else if (accept('"', status) || accept("'", status) || accept("`", status)) {
			// Ignore the content of strings
			const char = status.source[status.i - 1];
			content += char;
			let stringStart = status.i;
			do {
				status.i = status.source.indexOf(char, status.i) + 1;
			} while (status.source[status.i - 2] === "\\");
			content += status.source.substring(stringStart, status.i - 1);
			content += char;
		} else if (accept("//", status)) {
			// Ignore the content of one-line comments
			let commentStart = status.i;
			status.i = status.source.indexOf("\n", status.i) + 1;
			if (!stripComments) {
				content += `//${status.source.substring(commentStart, status.i - 1)}`;
			}
			content += "\n";
		} else if (accept("/*", status)) {
			// Ignore the content of multiple-line comments
			let commentStart = status.i;
			status.i = status.source.indexOf("*/", status.i) + 2;
			if (!stripComments) {
				content += `/*${status.source.substring(commentStart, status.i - 2)}*/`;
			}
		} else {
			content += status.source[status.i];
			status.i += 1;
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
						// Ignore commented imports
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
