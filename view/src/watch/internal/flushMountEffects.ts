import $run from "../$run";
import context from "../../global/context";

export default function flushMountEffects() {
  for (let fn of context.mountedFunctions) {
    $run(fn);
  }
}
