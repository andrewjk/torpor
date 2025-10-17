import $batch from "../watch/$batch";

export default function $debugBatch<T>(fn: () => T): T {
	return $batch(fn);
}
