import $cache from "../watch/$cache";

export default function $debugCache<T>(fn: () => T): T {
	return $cache(fn);
}
