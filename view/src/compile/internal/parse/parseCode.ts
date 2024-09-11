import ParseResult from "../../types/ParseResult";
import isSpaceNode from "../../types/nodes/isSpaceNode";
import { trimQuotes } from "../utils";
import ParseStatus from "./ParseStatus";
import parseMarkup from "./parseMarkup";
import scopeStyles from "./scopeStyles";

export default function parseCode(source: string): ParseResult {
	const status: ParseStatus = {
		source,
		i: 0,
		errors: [],
	};

	parseMarkup(status, source);

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
