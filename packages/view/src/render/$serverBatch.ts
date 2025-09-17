export default function $serverBatch<T>(fn: () => T): T {
	return fn();
}
