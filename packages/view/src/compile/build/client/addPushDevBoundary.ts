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

		// The label is debug metadata, so normalize it to a single line: control
		// headers (`@if (...)` etc) keep their original source text, which can
		// span multiple lines, and a line terminator inside the emitted string
		// literal would be a parse error in the dev client
		name = name.replace(/\s+/g, " ");

		// Ensure the name is wrapped with quotes, and internal quotes are escaped
		const nameHasQuotes =
			(name.startsWith("'") && name.endsWith("'")) ||
			(name.startsWith('"') && name.endsWith('"')) ||
			(name.startsWith("`") && name.endsWith("`"));
		if (nameHasQuotes) {
			const quote = name[0];
			name = quote + name.substring(1, name.length - 1).replaceAll(quote, "\\" + quote) + quote;
		} else {
			name = JSON.stringify(name);
		}

		b.append(`t_push_dev_bound("${type}", ${name});`);
		b.append("");
	}
}
