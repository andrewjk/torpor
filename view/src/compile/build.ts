import type BuildOptions from "../types/BuildOptions";
import type ComponentTemplate from "../types/ComponentTemplate";
import buildCode from "./build/client/buildCode";
import buildStyles from "./build/client/buildStyles";
import buildServerCode from "./build/server/buildServerCode";
import type BuildResult from "./types/BuildResult";

/**
 * Builds a component template into code and styles for rendering
 *
 * @param name The name of the component
 * @param template The component template, possibly including script, markup and styles
 *
 * @returns The component's code and styles
 */
export default function build(
	name: string,
	template: ComponentTemplate,
	options?: BuildOptions,
): BuildResult {
	let code = options?.server
		? buildServerCode(name, template, options)
		: buildCode(name, template, options);
	let styles = template.style ? buildStyles(name, template) : undefined;
	let styleHash = template.styleHash;
	return {
		code,
		styles,
		styleHash,
	};
}
