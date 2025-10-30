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

		// Ensure the name is wrapped with quotes, and internal quotes are escaped
		const nameHasQuotes =
			(name.startsWith("'") && name.endsWith("'")) ||
			(name.startsWith('"') && name.endsWith('"')) ||
			(name.startsWith("`") && name.endsWith("`"));
		if (nameHasQuotes) {
			const quote = name[0];
			name = quote + name.substring(1, name.length - 1).replaceAll(quote, "\\" + quote) + quote;
		} else {
			name = `"${name.replaceAll('"', '\\"')}"`;
		}

		b.append(`t_push_dev_bound("${type}", ${name});`);
		b.append("");
	}
}
