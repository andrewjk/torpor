import $run from "../$run";
import context from "./context";

export default function flushMountEffects() {
	for (let fn of context.mountEffects) {
		$run(fn);
	}
}
