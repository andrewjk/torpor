import buildCode from "./internal/build/buildCode";
import buildStyles from "./internal/build/buildStyles";
import type BuildResult from "./types/BuildResult";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into code and styles for rendering
 * @param name The name of the component
 * @param parts The constituent parts of the component, possibly including script, markup and styles
 * @returns the component's code and styles
 */
export default function build(name: string, parts: ComponentTemplate): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}
