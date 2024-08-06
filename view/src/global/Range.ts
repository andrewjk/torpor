import type Effect from "./Effect";
import type EffectPath from "./EffectPath";

export default interface Range {
  startNode: Node | null;
  endNode: Node | null;

  parent: Range | null;
  children: Range[] | null;

  /** The index of the range if it is a branch in e.g. an if, switch or loop */
  index: number;

  /**
   * A map of ranges and the object/property/effects attached to them.
   *
   * This is used to remove effects from the effectSubs collection when a range is removed.
   */
  objectEffects: Set<EffectPath> | null;

  /**
   * A map of ranges and the effects attached to them that don't have an associated object/property
   * subscription.
   *
   * This is used to run effect cleanups when a range is removed.
   */
  emptyEffects: Set<Effect> | null;
}
