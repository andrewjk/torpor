import type ParseStatus from "./internal/parse/ParseStatus";
import checkAndApplyStyles from "./internal/parse/checkAndApplyStyles";
import parseMarkup from "./internal/parse/parseMarkup";
import type ParseResult from "./types/ParseResult";

/**
 * Parses source code into a component template
 * @param source The template's source code
 * @returns A result indicating whether parsing was ok, and if so, containing
 *          the component template's parts such as script, markup and styles
 */
export default function parse(source: string): ParseResult {
	const status: ParseStatus = {
		source,
		i: 0,
		errors: [],
	};

	parseMarkup(status, source);

	checkAndApplyStyles(status);

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
	const propsMatches = source.matchAll(/\$props\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
	const props: string[] = [];
	for (let match of propsMatches) {
		const name = match[1] || match[2] || match[3];
		if (!props.includes(name)) {
			props.push(name);
		}
	}
	return props;
}

function getContextUsage(source: string): string[] {
	const contextsMatches = source.matchAll(/\$context\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
	const contexts: string[] = [];
	for (let match of contextsMatches) {
		const name = match[1] || match[2] || match[3];
		if (!contexts.includes(name)) {
			contexts.push(name);
		}
	}
	return contexts;
}
