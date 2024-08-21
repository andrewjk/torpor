import buildStyles from "./internal/build/buildStyles";
import buildServerCode from "./internal/buildServer/buildServerCode";
import type BuildResult from "./types/BuildResult";
import type ComponentTemplate from "./types/ComponentTemplate";

/**
 * Builds a component template into a function that builds HTML, for static or server rendering
 * @param name The name of the component
 * @param parts The constituent parts of the component, possibly including script, markup and styles
 * @returns the component's code and styles
 */
export default function buildServer(name: string, parts: ComponentTemplate): BuildResult {
  const result: BuildResult = {
    code: buildServerCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}
