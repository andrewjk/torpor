import $cache from "../render/$cache";

export default function $debugCache<T>(fn: () => T): T {
	return $cache(fn);
}
