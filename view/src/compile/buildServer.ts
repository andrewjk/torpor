import buildStyles from "./internal/build/buildStyles";
import buildCode from "./internal/buildServer/buildServerCode";
import type BuildResult from "./types/BuildResult";
import type ComponentParts from "./types/ComponentParts";

/**
 * Builds a component template into a function that builds HTML, for static or server rendering
 * @param name The name of the component
 * @param parts The constituent parts of the component, possibly including script, HTML and styles
 * @returns the component's code and styles
 */
export default function buildServer(name: string, parts: ComponentParts): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}
