import type Effect from "./Effect";
import type Range from "./Range";


/**
 * The global context for setting up effects and updating subscriptions.
 */
interface Context {
  /**
   * The effect that is currently being run.
   */
  activeEffect?: Effect;
  /**
   * Whether the active effect has been subscribed to by accessing a property of a watched object.
   *
   * If there is an active range, and the active effect has been subscribed to, we know that the
   * effect has been added to the rangeEffectSubs collection during effect tracking.
   *
   * If there is an active range, and the active effect has NOT been subscribed to, we need to add
   * the effect to the rangeEffects collection so that any effect cleanup can be run when the range
   * is deleted.
   */
  activeEffectSubbed: boolean;
  /**
   * A map of objects, their properties, and the object/property effects.
   *
   * When a property of a proxied object (created via the $watch function) is changed, we look up
   * the object, then the property, and run any effects that are found.
   */
  effectSubs: Map<object, Map<string | symbol, Set<Effect>>>;
  /**
   * A stack with the range that is currently being created on top.
   */
  rangeStack: Range[];
  /**
   * The range that is currently being created.
   */
  activeRange: Range | null;
}

const context: Context = {
  activeEffect: undefined,
  activeEffectSubbed: false,
  effectSubs: new Map<object, Map<string | symbol, Set<Effect>>>(),
  rangeStack: [],
  get activeRange() {
    return this.rangeStack[this.rangeStack.length - 1];
  },
};

export default context;
