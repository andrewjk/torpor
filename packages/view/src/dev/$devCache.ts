import $cache from "../watch/$cache";

export default function $devCache<T>(fn: () => T): T {
	return $cache(fn);
}
