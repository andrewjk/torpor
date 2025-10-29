import type WatchOptions from "../types/WatchOptions";
import $watch from "../watch/$watch";

//import devContext from "./devContext";

export default function $devWatch<T extends Record<PropertyKey, any>>(
	object: T,
	options?: WatchOptions,
): T {
	/*
	let keys = Object.keys(object);
	if (keys.length > 5) {
		keys = [...keys.slice(0, 5), "…"];
	}
	let name = keys.length > 0 ? `{ ${keys.join(", ")} }` : "{}";
	devContext.boundaries.push({
		type: "watch",
		id: crypto.randomUUID(),
		name,
		depth: devContext.depth,
		target: null,
	});
	*/

	return $watch(object, options);
}
