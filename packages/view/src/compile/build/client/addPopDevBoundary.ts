import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addPopDevBoundary(status: BuildStatus, b: Builder): void {
	if (status.options.dev === true) {
		status.imports.add("t_pop_dev_bound");
		b.append("");
		b.append(`t_pop_dev_bound();`);
	}
}
