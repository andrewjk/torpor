import buildCode from "./internal/build/buildCode";
import buildStyles from "./internal/build/buildStyles";
import type BuildResult from "./types/BuildResult";
import type ComponentParts from "./types/ComponentParts";

// TODO: Too many branches for ifs etc?

export default function build(name: string, parts: ComponentParts): BuildResult {
  const result: BuildResult = {
    code: buildCode(name, parts),
    styles: parts.style ? buildStyles(name, parts) : undefined,
    styleHash: parts.styleHash,
  };
  return result;
}
