import buildCode from "./compile/build/client/buildCode";
import buildStyles from "./compile/build/client/buildStyles";
import buildServerCode from "./compile/build/server/buildServerCode";
import type BuildResult from "./compile/types/BuildResult";
import type BuildOptions from "./types/BuildOptions";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into code and styles for rendering
 *
 * @param name The name of the component
 * @param template The component template, possibly including script, markup and styles
 * @returns the component's code and styles
 */
export default function build(
	name: string,
	template: ComponentTemplate,
	options?: BuildOptions,
): BuildResult {
	let code = options?.server ? buildServerCode(name, template) : buildCode(name, template);
	let styles = template.style ? buildStyles(name, template) : undefined;
	let styleHash = template.styleHash;
	return {
		code,
		styles,
		styleHash,
	};
}
