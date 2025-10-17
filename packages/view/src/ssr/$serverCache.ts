export default function $serverCache<T>(fn: () => T): T {
	return fn();
}
