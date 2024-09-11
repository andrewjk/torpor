import type BuildOptions from "./BuildOptions";
import buildCode from "./internal/build/client/buildCode";
import buildStyles from "./internal/build/client/buildStyles";
import buildServerCode from "./internal/build/server/buildServerCode";
import type BuildResult from "./types/BuildResult";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into code and styles for rendering
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
