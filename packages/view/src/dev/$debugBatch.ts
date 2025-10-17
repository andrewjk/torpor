import $batch from "../render/$batch";

export default function $debugBatch<T>(fn: () => T): T {
	return $batch(fn);
}
