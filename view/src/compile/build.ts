import buildCode from "./internal/build/buildCode";
import buildStyles from "./internal/build/buildStyles";
import type BuildResult from "./types/BuildResult";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into code and styles for rendering
 * @param name The name of the component
 * @param template The component template, possibly including script, markup and styles
 * @returns the component's code and styles
 */
export default function build(name: string, template: ComponentTemplate): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, template),
    styles: template.style ? buildStyles(name, template) : undefined,
    styleHash: template.styleHash,
  };
  return result;
}
