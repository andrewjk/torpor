import $peek from "../watch/$peek";

export default function $debugPeek<T>(fn: () => T): T {
	return $peek(fn);
}
