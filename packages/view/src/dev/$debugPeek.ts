import $peek from "../render/$peek";

export default function $debugPeek<T>(fn: () => T): T {
	return $peek(fn);
}
