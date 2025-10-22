import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import $run from "../watch/$run";
import popDevBoundary from "./popDevBoundary";
import pushDevBoundary from "./pushDevBoundary";

export default function $devRun(fn: () => Cleanup | void, name?: string): Effect {
	//if (name === undefined) {
	//	const details = String(fn);
	//	name = details;
	//	name = name.substring(name.indexOf("{") + 1).trimStart();
	//	name = name.substring(0, name.indexOf("\n"));
	//	name += "…";
	//}

	pushDevBoundary("run", name || "anon run");

	const result = $run(fn, name);

	popDevBoundary();

	return result;
}
