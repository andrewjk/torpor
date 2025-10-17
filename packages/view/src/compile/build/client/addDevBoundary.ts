import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addDevBoundary(name: string, status: BuildStatus, b: Builder): void {
	if (status.options.dev === true) {
		status.imports.add("devContext");
		b.append(`devContext.boundaries.push("${name}");`);
	}
}
