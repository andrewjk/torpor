import $peek from "../watch/$peek";

export default function $devPeek<T>(fn: () => T): T {
	return $peek(fn);
}
