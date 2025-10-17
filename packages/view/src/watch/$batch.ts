import context from "../render/context";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";

/**
 * Runs updates to proxy values in a batch, where the updates are stored in
 * context, and dependent effects are run all at once at the end.
 *
 * @param fn The function containing the batched updates to run.
 */
export default function $batch<T>(fn: () => T): T {
	if (context.batch > 0) {
		return fn();
	}

	batchStart();
	try {
		return fn();
	} finally {
		batchEnd();
	}
}
