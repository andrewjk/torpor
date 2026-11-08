import context from "../render/context";
import devAssert from "../dev/devAssert";
import triggerEffects from "./triggerEffects";

export default function batchEnd(): void {
	devAssert(context.batch > 0, "batchEnd called without a matching batchStart");
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
