import type Range from "./Range";

type Cleanup = () => void;
type Effect = () => Cleanup | undefined;

type ObjectEffectsMap = Map<object, PropertyEffectsMap>;
type PropertyEffectsMap = Map<string | symbol, Set<Effect>>;
type EffectCleanupsMap = Map<Effect, Cleanup>;

type RangeEffectsMap = Map<Range, RangeEffectsSet>;
type RangeEffectsSet = Set<{
  target: object;
  prop: string | symbol;
  effect: Effect;
}>;

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
  activeEffectSubbed?: boolean;
  /**
   * A map of objects, their properties, and the object/property effects.
   *
   * When a property of a proxied object (created via the $watch function) is changed, we look up
   * the object, then the property, and run any effects that are found.
   */
  effectSubs: ObjectEffectsMap;
  /**
   * A map of cleanup functions to run, keyed by effect.
   */
  effectCleanups: EffectCleanupsMap;
  /**
   * The range that is currently being created.
   */
  activeRange?: Range;
  /**
   * A map of ranges and the object/property/effects attached to them.
   *
   * This is used to remove effects from the effectSubs collection when a range is removed.
   */
  rangeEffectSubs: RangeEffectsMap;
  /**
   * A map of ranges and the effects attached to them that don't have an associated object/property
   * subscription.
   *
   * This is used to run effect cleanups when a range is removed.
   */
  rangeEffects: Map<Range, Set<Effect>>;
}

const context: Context = {
  effectSubs: new Map<object, PropertyEffectsMap>(),
  effectCleanups: new Map<Effect, Cleanup>(),
  rangeEffectSubs: new Map<Range, RangeEffectsSet>(),
  rangeEffects: new Map<Range, Set<Effect>>(),
};

export default context;
