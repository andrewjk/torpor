import context from "../global/context";

export default function $run(effect: () => (() => void) | void) {
  context.activeEffect = effect;
  context.activeEffectSubbed = false;

  // Run the effect to register its subscriptions and get its (optional) cleanup function
  const cleanup = effect();

  if (typeof cleanup === "function") {
    // Add the cleanup function to the global context
    // TODO: Probably use a noop
    context.effectCleanups.set(effect, cleanup);

    // If there's an active DOM range, and no subscription was registered for this effect (i.e.
    // the effect doesn't depend on any watched properties), register the active effect with the
    // active range, so that it will be cleaned up when the range is removed
    if (context.activeRange && !context.activeEffectSubbed) {
      context.activeRange.emptyEffects = context.activeRange.emptyEffects || new Set();
      context.activeRange.emptyEffects.add(context.activeEffect);
    }
  }

  context.activeEffect = undefined;
}
