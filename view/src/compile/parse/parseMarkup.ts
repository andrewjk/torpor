import trimQuotes from "../utils/trimQuotes";
import type ParseStatus from "./ParseStatus";
import parseChildTemplate from "./parseChildTemplate";
import parseDocs from "./parseDocs";
import parseElement from "./parseElement";
import parseImports from "./parseImports";
import parseStyles from "./parseStyles";
import parseTag from "./parseTag";
import accept from "./utils/accept";
import addError from "./utils/addError";

export default function parseMarkup(status: ParseStatus, source: string) {
	while (status.i < source.length) {
		if (accept("<!--", status)) {
			// It's a comment, swallow it
			status.i = status.source.indexOf("-->", status.i) + 3;
		} else if (accept("@//", status)) {
			// Swallow one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("@/*", status)) {
			// Swallow block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
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
				parseImports(status);
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
			// Rewind to the start of the element
			status.i = start;
			if (status.template === undefined) {
				status.template = parseElement(status);
			} else {
				addError(status, `Multiple top-level elements: ${element.tagName}`, start);
				parseElement(status);
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
			// Ignore the content of block comments
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
