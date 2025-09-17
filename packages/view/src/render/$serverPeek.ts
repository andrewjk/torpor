export default function $serverPeek<T>(fn: () => T): T {
	return fn();
}
