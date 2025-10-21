import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import $run from "../watch/$run";
import devContext from "./devContext";

export default function $devRun(fn: () => Cleanup | void, name?: string): Effect {
	if (name === undefined) {
		name = String(fn);
		name = name.substring(name.indexOf("{") + 1).trimStart();
		name = name.substring(0, name.indexOf("\n"));
		name += "…";
	}

	devContext.boundaries.push(`$run(${name})`);

	return $run(fn, name);
}
