import context from "../render/context";
import { type Computed } from "../types/Computed";
import trackEffect from "./trackEffect";

export default function runComputed<T>(computed: Computed<T>): T {
	//console.log(`running computed '${computed.name}'`);

	// Store the active target
	const oldActiveTarget = context.activeTarget;

	computed.running = true;
	computed.didError = false;

	try {
		// Set the active target, so that any properties accessed while running it
		// will trigger it in future
		context.activeTarget = computed;

		// Run the computed and gather its dependencies
		computed.value = computed.run();
	} catch (err) {
		computed.didError = true;
		// @ts-ignore
		computed.value = err;
		throw err;
	} finally {
		// Set the active target back to what it was previously
		context.activeTarget = oldActiveTarget;

		computed.running = false;
	}

	trackEffect(computed);

	return computed.value;
}
