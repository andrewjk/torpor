import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addPushDevBoundary(
	type: "component" | "region" | "run" | "watch" | "control" | "branch",
	name: string,
	status: BuildStatus,
	b: Builder,
): void {
	if (status.options.dev === true) {
		status.imports.add("t_push_dev_bound");

		let nameHasQuotes =
			(name.startsWith("'") && name.endsWith("'")) ||
			(name.startsWith('"') && name.endsWith('"')) ||
			name.startsWith("`") ||
			name.endsWith("`");
		if (!nameHasQuotes) {
			name = `"${name}"`;
		}

		b.append(`t_push_dev_bound("${type}", ${name});`);
		b.append("");
	}
}
