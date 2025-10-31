import type TemplateComponent from "../../types/TemplateComponent";
import type ParseResult from "../types/ParseResult";
import endOfString from "../utils/endOfString";
import endOfTemplateString from "../utils/endOfTemplateString";
import isElementNode from "../utils/isElementNode";
import isSpaceNode from "../utils/isSpaceNode";
import trimQuotes from "../utils/trimQuotes";
import type ParseStatus from "./ParseStatus";
import parseInlineScript from "./parseInlineScript";
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
		script: [],
		components: [],
		stack: [],
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
				parseComponentEnd(status);
			}
		} else if (accept("function", status)) {
			// If the function name starts with a capital, parse it as a component
			if (consumeSpace(status)) {
				if (/[A-Z]/.test(source[status.i])) {
					parseComponentStart(status);
				} else {
					// Unconsume the last space
					status.i--;
				}
			}
		} else if (accept("const", status)) {
			// If it's a function and its name starts with a capital, parse it as a component
			if (consumeSpace(status)) {
				if (/[A-Z]/.test(source[status.i])) {
					const start = status.i;
					consumeAlphaNumeric(status);
					consumeSpace(status);
					if (accept("=", status)) {
						consumeSpace(status);
						if (accept("(", status, false)) {
							status.i = start;
							parseComponentStart(status);
						}
					}
				} else {
					// Unconsume the last space
					status.i--;
				}
			}
		} else if (accept("export", status)) {
			// If it's an anonymous default export function, parse it as a component
			const start = status.i;
			if (
				consumeSpace(status) &&
				accept("default", status) &&
				consumeSpace(status) &&
				accept("(", status, false)
			) {
				parseComponentStart(status);
			} else {
				status.i = start;
			}
		} else if (accept("@render", status, false)) {
			parseComponentRender(status);
		} else if (accept("@head", status, false)) {
			parseComponentHead(status);
		} else if (accept("@style", status, false)) {
			parseComponentStyle(status);
		}
	}
	status.script.push({
		script: source.substring(status.marker, source.length),
		span: { start: status.marker, end: source.length },
	});

	scopeStyles(status);

	const ok = !status.errors.length;
	if (!ok) {
		status.errors = status.errors.sort((a, b) => a.startIndex - b.startIndex);
	}

	return {
		ok,
		errors: status.errors,
		template: ok
			? {
					imports: status.imports,
					script: status.script,
					components: status.components,
				}
			: undefined,
	};
}

function parseComponentStart(status: ParseStatus) {
	let source = status.source.substring(status.marker, status.i);
	let exported = /export\s+(default\s+)*(function\s+|const\s+)*$/.test(source);
	let def = /export\s+default\s+(function\s+|const\s+)*$/.test(source);
	let isConst = /const\s+$/.test(source);
	let isAnon = /export default\s+$/.test(source);

	let componentStart = status.i;
	let name = consumeAlphaNumeric(status);

	const current: TemplateComponent = {
		start: componentStart,
		name,
		exported,
		default: def,
	};
	status.components.push(current);

	// Look for /** ... */ documentation comments
	let presource = source.substring(0, status.i).trimEnd();
	let lastNewline = presource.lastIndexOf("\n");
	if (lastNewline !== -1) {
		presource = presource.substring(0, lastNewline).trimEnd();
		if (presource.endsWith("*/")) {
			for (let i = presource.length; i >= 0; i--) {
				if (presource.substring(i, i + 3) === "/**") {
					current.documentation = presource.substring(i);
					break;
				}
			}
		}
	}

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

	status.script.push({
		script: status.source.substring(status.marker, start),
		span: { start: status.marker, end: start },
	});
	status.script.push({ script: "/* @params */", span: { start, end } });

	current.params = status.source.substring(start, end);
	if (current.params.trim().length === 0) {
		current.params = undefined;
	}

	// Look for a params type or interface
	// Might need to get fancier with this
	const paramsMatch = current.params?.match(/\$props:\s*([$A-Za-z0-9]+)/);
	if (paramsMatch) {
		let propsTypeName = paramsMatch[1];
		let propsTypeStart = status.source.search(new RegExp(`interface\\s+${propsTypeName}`));
		if (propsTypeStart === -1) {
			propsTypeStart = status.source.search(new RegExp(`type\\s+${propsTypeName}`));
		}
		if (propsTypeStart !== -1) {
			let bracesStart = status.source.indexOf("{", propsTypeStart);
			if (bracesStart !== -1) {
				const status2: ParseStatus = {
					source: status.source,
					i: bracesStart + 1,
					marker: 0,
					level: 0,
					imports: [],
					script: [],
					components: [],
					stack: [],
					errors: [],
				};
				const propsType = parseInlineScript(status2);
				if (propsType) {
					current.propsType = `${status.source.substring(propsTypeStart, bracesStart)}{${propsType}}`;
				}
			}
		}
	}

	status.marker = end;
	status.i = status.marker;

	accept(")", status);
	consumeSpace(status);

	if (isConst || isAnon) {
		accept("=>", status);
		consumeSpace(status);
	}

	accept("{", status);
	status.level += 1;

	// Sneak in a function type
	const postFunctionChunk = {
		script: status.source.substring(status.marker, status.i),
		span: { start: status.marker, end: status.i },
	};
	if (/\)\s+\{/.test(postFunctionChunk.script)) {
		postFunctionChunk.script = ") /* @return_type */ {";
	}
	status.script.push(postFunctionChunk);

	status.script.push({
		script: "/* @start */",
		span: { start: 0, end: 0 },
	});

	status.marker = status.i;
	const space = consumeSpace(status);
	status.script.push({
		script: space,
		span: { start: status.marker, end: status.i },
	});

	status.marker = status.i;
	status.i -= 1;
}

function parseComponentRender(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	if (current.markup) {
		addError(status, `Multiple @render sections`, status.i, status.i + "@render".length);
	}

	status.script.push({
		script: status.source.substring(status.marker, status.i),
		span: { start: status.marker, end: status.i },
	});
	status.script.push({
		script: "/* @render */",
		span: { start: 0, end: 0 },
	});

	accept("@render", status);
	consumeSpace(status);
	if (accept("{", status)) {
		parseMarkup(status, status.source);
		accept("}", status);
	}

	status.marker = status.i;
}

function parseComponentHead(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	if (current.head) {
		addError(status, `Multiple @head sections`, status.i, status.i + "@head".length);
	}

	status.script.push({
		script: status.source.substring(status.marker, status.i),
		span: { start: status.marker, end: status.i },
	});
	status.script.push({
		script: "/* @head */",
		span: { start: 0, end: 0 },
	});

	// HACK: add a new component, and move its markup into the current
	// component's head section after
	status.components.push({
		start: status.i,
	});

	accept("@head", status);
	consumeSpace(status);
	if (accept("{", status)) {
		parseMarkup(status, status.source);
		accept("}", status);
	}

	// Swap render and markup
	const head = status.components.pop();
	current.head = head?.markup;

	status.marker = status.i;
}

function parseComponentStyle(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	if (current.style) {
		addError(status, `Multiple @style sections`, status.i, status.i + "@style".length);
	}

	status.script.push({
		script: status.source.substring(status.marker, status.i),
		span: { start: status.marker, end: status.i },
	});
	status.script.push({
		script: "/* @style */",
		span: { start: 0, end: 0 },
	});

	let start = -1;
	let end = status.source.length;
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
		} else if (char === '"' || char === "'") {
			// Skip string contents
			let start = status.i;
			status.i = endOfString(char, status.source, start);
			styleSource += status.source.substring(start, status.i + 1);
		} else if (char === "`") {
			// Skip interpolated string contents
			let start = status.i;
			status.i = endOfTemplateString(status.source, start);
			styleSource += status.source.substring(start, status.i + 1);
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

function parseComponentEnd(status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	status.script.push({
		script: status.source.substring(status.marker, status.i),
		span: { start: status.marker, end: status.i },
	});

	status.script.push({
		script: "/* @end */",
		span: { start: 0, end: 0 },
	});

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
		isElementNode(current.markup.children[0]) &&
		current.markup.children[0].tagName === "html" &&
		isSpaceNode(current.markup.children[0].children[0])
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
	} else if (char === '"' || char === "'") {
		// Skip string contents
		status.i = endOfString(char, status.source, status.i);
		return true;
	} else if (char === "`") {
		// Skip interpolated string contents
		status.i = endOfTemplateString(status.source, status.i);
		return true;
	}
	return false;
}
