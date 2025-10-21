import $batch from "../watch/$batch";

export default function $devBatch<T>(fn: () => T): T {
	return $batch(fn);
}
