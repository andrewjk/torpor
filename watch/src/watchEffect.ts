import context from "./internal/context";

export default function watchEffect(effect: () => void) {
  context.activeEffect = effect;
  effect();
  context.activeEffect = undefined;
}
