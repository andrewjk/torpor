import type TemplateComponent from "../../types/TemplateComponent";
import type ParseResult from "../types/ParseResult";
import isSpaceNode from "../types/nodes/isSpaceNode";
import trimQuotes from "../utils/trimQuotes";
import type ParseStatus from "./ParseStatus";
import parseMarkup from "./parseMarkup";
import parseStyleElement from "./parseStyles";
import scopeStyles from "./scopeStyles";
import accept from "./utils/accept";
import addError from "./utils/addError";
import consumeAlphaNumeric from "./utils/consumeAlphaNumeric";
import consumeSpace from "./utils/consumeSpace";

export default function parseCode(source: string): ParseResult {
	const status: ParseStatus = {
		source,
		i: 0,
		marker: 0,
		level: 0,
		imports: [],
		script: "",
		components: [],
		errors: [],
	};

	for (status.i; status.i < source.length; status.i++) {
		if (consumeScriptComments(status)) {
			// Keep going
		} else if (status.source[status.i] === "{") {
			status.level += 1;
		} else if (status.source[status.i] === "}") {
			status.level -= 1;
			if (status.level === 0) {
				endComponent(status);
			}
		} else if (accept("function", status)) {
			// If the function name starts with a capital, parse it as a component
			consumeSpace(status);
			if (source[status.i] === source[status.i].toLocaleUpperCase()) {
				startComponent(status);
			}
		} else if (accept("@render", status, false)) {
			parseComponentRender(status);
		} else if (accept("@style", status, false)) {
			parseComponentStyle(status);
		}
	}
	status.script += source.substring(status.marker, source.length);

	scopeStyles(status);

	const ok = !status.errors.length;

	return {
		ok,
		errors: status.errors,
		template: ok
			? {
					imports: status.imports,
					script: status.script,
					components: status.components.map((c) => {
						return {
							start: c.start,
							name: c.name,
							default: c.default,
							params: c.params,
							markup: c.markup
								? {
										type: "root",
										children: [c.markup],
									}
								: undefined,
							style: c.style,
							props: c.props,
							contextProps: c.contextProps,
						} satisfies TemplateComponent;
					}),
				}
			: undefined,
	};
}

function startComponent(status: ParseStatus) {
	let def = /export\s+default\s+function\s+$/.test(status.source.substring(0, status.i));

	status.components.push({
		start: status.i,
		name: consumeAlphaNumeric(status),
		default: def,
	});
	const current = status.components.at(-1);
	if (!current) return;

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

	current.params = status.source.substring(start, end).trim() || undefined;

	status.marker = end;
	status.i = status.marker;

	accept(")", status);
	consumeSpace(status);
	accept("{", status);
	status.level += 1;

	const space = consumeSpace(status);
	status.script += status.source.substring(status.marker, status.i) + "/* @start */" + space;

	status.marker = status.i;
	status.i -= 1;
}

function parseComponentRender(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	if (current.markup) {
		addError(status, `Multiple @render sections`, status.i);
	}

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
	const current = status.components.at(-1);
	if (!current) return;

	if (current.style) {
		addError(status, `Multiple @style sections`, status.i);
	}

	status.script += status.source.substring(status.marker, status.i);

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

	status.i = end + 2;
	status.marker = status.i;
}

function endComponent(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	status.script += status.source.substring(status.marker, status.i);
	if (status.script.endsWith("\n")) {
		status.script += "\t/* @end */\n";
	} else {
		status.script += "/* @end */";
	}

	// Get all usages of $props.name and $props["name"]
	// Get all usages of $context.name and $context["name"]
	const componentSource = status.source.substring(current.start || 0, status.i);
	current.props = getPropsUsage(componentSource);
	current.contextProps = getContextUsage(componentSource);

	// If the top-level element is <html> and there is whitespace after it,
	// delete the whitespace, as that's what browsers seem to do. It may be
	// better instead to create whitespace if we don't find it when hydrating...
	if (
		current.markup &&
		current.markup.tagName === "html" &&
		isSpaceNode(current.markup.children[0])
	) {
		current.markup.children.splice(1, 1);
	}

	status.marker = status.i;
}

function getPropsUsage(source: string): string[] | undefined {
	const propsMatches = source.matchAll(/\$props\s*(?:\.([\d\w]+)|\[([^\]]+)\])/g);
	const props: string[] = [];
	for (let match of propsMatches) {
		const name = trimQuotes(match[1] || match[2]);
		if (!props.includes(name)) {
			props.push(name);
		}
	}
	return props.length ? props : undefined;
}

function getContextUsage(source: string): string[] | undefined {
	const contextsMatches = source.matchAll(/\$context\s*(?:\.([\d\w]+)|\[([^\]]+)\])/g);
	const contexts: string[] = [];
	for (let match of contextsMatches) {
		const name = trimQuotes(match[1] || match[2]);
		if (!contexts.includes(name)) {
			contexts.push(name);
		}
	}
	return contexts.length ? contexts : undefined;
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
