import type WatchOptions from "../types/WatchOptions";
import $watch from "../watch/$watch";
import devContext from "./devContext";

export default function $devWatch<T extends Record<PropertyKey, any>>(
	object: T,
	options?: WatchOptions,
): T {
	devContext.boundaries.push(`$watch({ ${Object.keys(object).join(", ")} })`);

	return $watch(object, options);
}
