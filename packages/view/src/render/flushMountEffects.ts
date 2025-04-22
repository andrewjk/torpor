import $run from "./$run";
import context from "./context";

export default function flushMountEffects(): void {
	for (let fn of context.mountEffects) {
		$run(fn);
	}
}
