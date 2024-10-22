import type ParseResult from "../types/ParseResult";
import isSpaceNode from "../types/nodes/isSpaceNode";
import trimQuotes from "../utils/trimQuotes";
import ParseStatus from "./ParseStatus";
import parseImports from "./parseImports";
import parseMarkup from "./parseMarkup";
import parseStyleElement from "./parseStyles";
import scopeStyles from "./scopeStyles";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseCode(name: string, source: string): ParseResult {
	const status: ParseStatus = {
		name,
		source,
		i: 0,
		errors: [],
	};

	parseImports(status);

	let script = "";
	let marker = 0;
	for (let i = 0; i < source.length; i++) {
		if (source[i] === "/" && source[i + 1] === "/") {
			i = source.indexOf("\n", i);
		} else if (source[i] === "/" && source[i + 1] === "*") {
			i = source.indexOf("*/", i) + 1;
		} else if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
			for (let j = i + 1; j < source.length; j++) {
				if (source[j] === source[i] && source[j - 1] !== "\\") {
					i = j;
					break;
				}
			}
		} else if (source[i] === "f" && source.substring(i, i + "function".length) === "function") {
			//console.log("HMM", source.substring(i, i + "function".length + 20));
			for (let k = i + "function".length + 1; k < source.length; k++) {
				if (!isSpaceChar(source, k)) {
					if (source[k] === source[k].toLocaleUpperCase()) {
						//script += source.substring(marker, k - 1) + "/* @params */";
						let start = -1;
						let end = -1;
						let level = 0;
						// TODO: let k
						for (let j = k; j < source.length; j++) {
							let char = source[j];
							if (char === "(") {
								level += 1;
								if (start === -1) {
									start = j + 1;
								}
							} else if (char === ")") {
								level -= 1;
								if (level === 0) {
									end = j;
									break;
								}
							} else if (char === "/" && source[j + 1] === "/") {
								j = source.indexOf("\n", j);
							} else if (char === "/" && source[j + 1] === "*") {
								j = source.indexOf("*/", j) + 1;
							}
						}
						script += source.substring(marker, start) + "/* @params */";

						//const templateSource = source.substring(start, end);
						const params = source.substring(start, end).trim();
						if (params) {
							status.params = params;
						}
						//console.log("PARAMS", status.params, start, end, name);
						//console.log(source, start, end);
						//status.i = start;
						//parseMarkup(status, source);

						marker = end;
						i = marker;
					} else {
						break;
					}
				}
			}
		} else if (source[i] === "@") {
			if (source.substring(i, i + "@render".length) === "@render") {
				script += source.substring(marker, i) + "/* @render */";
				let start = -1;
				let end = -1;
				let level = 0;
				for (let j = i; j < source.length; j++) {
					let char = source[j];
					if (char === "{") {
						level += 1;
					} else if (char === "}") {
						level -= 1;
						if (level === 0) {
							end = j - 1;
							break;
						}
					} else if (char === "<" && start === -1) {
						start = j;
					} else {
						let sub = source.substring(j, j + 3);
						if (sub === "<!-") {
							j = source.indexOf("-->", j) + 2;
						} else if (sub === "@/*") {
							j = source.indexOf("*/", j) + 1;
						} else if (sub === "@//") {
							j = source.indexOf("\n", j);
						}
					}
				}
				//const templateSource = source.substring(start, end);

				status.i = start;
				parseMarkup(status, source);

				marker = end + 2;
				i = marker;
			} else if (source.substring(i, i + "@style".length) === "@style") {
				script += source.substring(marker, i); // + "/* @style */";
				let start = -1;
				let end = -1;
				let level = 0;
				// HACK: strip the comments out of styles only
				let styleSource = "";
				for (let j = i; j < source.length; j++) {
					let char = source[j];
					if (char === "{") {
						level += 1;
						if (start === -1) {
							start = j + 1;
						} else {
							styleSource += char;
						}
					} else if (char === "}") {
						level -= 1;
						if (level === 0) {
							end = j - 1;
							break;
						} else {
							styleSource += char;
						}
					} else if (char === "/" && source[j + 1] === "/") {
						j = source.indexOf("\n", j);
					} else if (char === "/" && source[j + 1] === "*") {
						j = source.indexOf("*/", j) + 1;
					} else if (char === '"' || char === "'" || char === "`") {
						styleSource += char;
						for (let l = j + 1; l < source.length; l++) {
							styleSource += char;
							if (source[l] === char && source[l - 1] !== "\\") {
								j = l;
								break;
							}
						}
					} else {
						if (start !== -1) {
							styleSource += char;
						}
					}
				}
				//const styleSource = source.substring(start, end);
				//console.log("STYLE", styleSource);
				status.i = start;
				status.style = parseStyleElement(styleSource.trim(), status);

				marker = end + 2;
				i = marker;
			}
		}
	}
	script += source.substring(marker, source.length);
	if (script) {
		status.script = script;
	}

	//if (name == "ParentChild")
	//console.log("SCRIPT", script);

	//parseMarkup(status, source);

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

	// HACK: get all usages of $props.name and $props["name"]
	// HACK: get all usages of $context.name and $context["name"]
	const props = getPropsUsage(source);
	const contextProps = getContextUsage(source);

	const ok = !status.errors.length;

	return {
		ok,
		errors: status.errors,
		template: ok
			? {
					docs: status.docs,
					imports: status.imports,
					script: status.script,
					params: status.params,
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
