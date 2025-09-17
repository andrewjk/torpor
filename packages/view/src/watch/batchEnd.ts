import context from "../render/context";
import triggerEffects from "./triggerEffects";

export default function batchEnd(): void {
	if (context.batch > 1) {
		context.batch--;
		return;
	}

	try {
		triggerEffects();
	} finally {
		context.batch = 0;
		context.batchOperation = 0;
		context.previousEffect = null;
	}
}
