import $watch from "../render/$watch";
import type WatchOptions from "../types/WatchOptions";
import devContext from "./devContext";

export default function $debugWatch<T extends Record<PropertyKey, any>>(
	object: T,
	options?: WatchOptions,
): T {
	devContext.boundaries.push(`$watch({ ${Object.keys(object).join(", ")} })`);

	return $watch(object, options);
}
