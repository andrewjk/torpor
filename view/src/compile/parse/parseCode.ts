import type ParseResult from "../types/ParseResult";
import isSpaceNode from "../types/nodes/isSpaceNode";
import trimQuotes from "../utils/trimQuotes";
import ParseStatus from "./ParseStatus";
import parseImports from "./parseImports";
import parseMarkup from "./parseMarkup";
import parseStyleElement from "./parseStyles";
import scopeStyles from "./scopeStyles";
import accept from "./utils/accept";
import consumeSpace from "./utils/consumeSpace";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseCode(name: string, source: string): ParseResult {
	const status: ParseStatus = {
		name,
		source,
		i: 0,
		marker: 0,
		script: "",
		errors: [],
	};

	// Get all imports, so that we can tell whether a tag is a component
	parseImports(status);

	// Get all usages of $props.name and $props["name"]
	// Get all usages of $context.name and $context["name"]
	const props = getPropsUsage(source);
	const contextProps = getContextUsage(source);

	for (; status.i < source.length; status.i++) {
		if (consumeScriptComments(status)) {
			// Keep going
		} else if (accept("function", status)) {
			// If the function name starts with a capital, parse it as a component
			consumeSpace(status);
			if (source[status.i] === source[status.i].toLocaleUpperCase()) {
				parseComponentParams(status);
			}
		} else if (accept("@render", status, false)) {
			parseComponentRender(status);
		} else if (accept("@style", status, false)) {
			parseComponentStyle(status);
		}
	}
	status.script += source.substring(status.marker, source.length);

	// If the top-level element is <html> and there is whitespace after it,
	// delete the whitespace, as that's what browsers seem to do
	// It may be better instead to create whitespace if we don't find it when
	// hydrating...
	if (
		status.template &&
		status.template.tagName === "html" &&
		isSpaceNode(status.template.children[0])
	) {
		status.template.children.splice(1, 1);
	}

	scopeStyles(status);

	const ok = !status.errors.length;

	return {
		ok,
		errors: status.errors,
		template: ok
			? {
					imports: status.imports,
					script: status.script || undefined,
					params: status.params || undefined,
					markup: status.template
						? {
								type: "root",
								children: [status.template],
							}
						: undefined,
					childComponents: status.childTemplates,
					style: status.style,
					styleHash: status.styleHash,
					props: props.length ? props : undefined,
					contextProps: contextProps.length ? contextProps : undefined,
				}
			: undefined,
	};
}

function parseComponentParams(status: ParseStatus) {
	let start = -1;
	let end = -1;
	let level = 0;
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (consumeScriptComments(status)) {
			// Keep going
		} else if (char === "(") {
			level += 1;
			if (start === -1) {
				start = status.i + 1;
			}
		} else if (char === ")") {
			level -= 1;
			if (level === 0) {
				end = status.i;
				break;
			}
		}
	}

	status.script += status.source.substring(status.marker, start) + "/* @params */";

	status.params = status.source.substring(start, end).trim() || undefined;

	status.marker = end;
	status.i = status.marker;

	accept(")", status);
	consumeSpace(status);
	accept("{", status);
	const space = consumeSpace(status);
	status.script += status.source.substring(status.marker, status.i) + "/* @start */" + space;

	status.marker = status.i;
	status.i -= 1;
}

function parseComponentRender(status: ParseStatus) {
	status.script += status.source.substring(status.marker, status.i) + "/* @render */";

	accept("@render", status);
	consumeSpace(status);
	if (accept("{", status)) {
		parseMarkup(status, status.source);
		accept("}", status);
	}
	status.marker = status.i;
}

function parseComponentStyle(status: ParseStatus) {
	status.script += status.source.substring(status.marker, status.i); // + "/* @style */";

	let start = -1;
	let end = -1;
	let level = 0;
	// HACK: strip the comments out of styles only
	let styleSource = "";
	for (; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		const nextChar = status.source[status.i + 1];
		if (char === "/" && nextChar === "/") {
			// Skip one-line comments
			status.i = status.source.indexOf("\n", status.i);
		} else if (char === "/" && nextChar === "*") {
			// Skip block comments
			status.i = status.source.indexOf("*/", status.i) + 1;
		} else if (char === '"' || char === "'" || char === "`") {
			// Skip string contents
			for (let j = status.i + 1; j < status.source.length; j++) {
				if (status.source[j] === char && status.source[j - 1] !== "\\") {
					status.i = j;
					break;
				}
			}
		} else if (char === "{") {
			level += 1;
			if (start === -1) {
				start = status.i + 1;
			} else {
				styleSource += char;
			}
		} else if (char === "}") {
			level -= 1;
			if (level === 0) {
				end = status.i - 1;
				break;
			} else {
				styleSource += char;
			}
		} else {
			if (start !== -1) {
				styleSource += char;
			}
		}
	}

	status.i = start;
	parseStyleElement(styleSource.trim(), status);

	status.marker = end + 2;
	status.i = status.marker;
}

function getPropsUsage(source: string): string[] {
	const propsMatches = source.matchAll(/\$props\s*(?:\.([\d\w]+)|\[([^\]]+)\])/g);
	const props: string[] = [];
	for (let match of propsMatches) {
		const name = trimQuotes(match[1] || match[2]);
		if (!props.includes(name)) {
			props.push(name);
		}
	}
	return props;
}

function getContextUsage(source: string): string[] {
	const contextsMatches = source.matchAll(/\$context\s*(?:\.([\d\w]+)|\[([^\]]+)\])/g);
	const contexts: string[] = [];
	for (let match of contextsMatches) {
		const name = trimQuotes(match[1] || match[2]);
		if (!contexts.includes(name)) {
			contexts.push(name);
		}
	}
	return contexts;
}

function consumeScriptComments(status: ParseStatus): boolean {
	const char = status.source[status.i];
	const nextChar = status.source[status.i + 1];
	if (char === "/" && nextChar === "/") {
		// Skip one-line comments
		status.i = status.source.indexOf("\n", status.i);
		return true;
	} else if (char === "/" && nextChar === "*") {
		// Skip block comments
		status.i = status.source.indexOf("*/", status.i) + 1;
		return true;
	} else if (char === '"' || char === "'" || char === "`") {
		// Skip string contents
		for (let j = status.i + 1; j < status.source.length; j++) {
			if (status.source[j] === char && status.source[j - 1] !== "\\") {
				status.i = j;
				break;
			}
		}
		return true;
	}
	return false;
}
