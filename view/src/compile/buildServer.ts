import buildStyles from "./internal/build/buildStyles";
import buildServerCode from "./internal/buildServer/buildServerCode";
import type BuildResult from "./types/BuildResult";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into a function that builds HTML, for static or server rendering
 * @param name The name of the component
 * @param template The component template, possibly including script, markup and styles
 * @returns the component's code and styles
 */
export default function buildServer(name: string, template: ComponentTemplate): BuildResult {
	const result: BuildResult = {
		code: buildServerCode(name, template),
		styles: template.style ? buildStyles(name, template) : undefined,
		styleHash: template.styleHash,
	};
	return result;
}
