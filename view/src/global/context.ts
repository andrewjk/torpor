import type Cleanup from "./types/Cleanup";
import type Effect from "./types/Effect";
import type Range from "./types/Range";

/**
 * The global context for setting up effects and updating subscriptions.
 */
interface Context {
  /** The effect that is currently being run. */
  activeEffect: Effect | null;

  /**
   * Whether the active effect has been subscribed to by accessing a property of
   * a watched object.
   *
   * If there is an active range, and the active effect has been subscribed to,
   * we know that the effect has been added to the range's objectEffects
   * collection during effect tracking.
   *
   * If there is an active range, and the active effect has NOT been subscribed
   * to, we need to add the effect to the rangeEffects collection so that any
   * effect cleanup can be run when the range is deleted.
   */
  activeEffectSubbed: boolean;

  /**
   * A map of objects, their properties, and the object/property effects.
   *
   * When a property of a proxied object (created via the $watch function) is
   * changed, we look up the object, then the property, and run any effects that
   * are found.
   */
  objectEffects: Map<object, Map<string | symbol, Effect[]>>;

  /** The range that is currently being created. */
  activeRange: Range | null;

  /**
   * Functions that were run via $mount, which should be collected and flushed
   * when the component is done mounting
   */
  mountedFunctions: (() => Cleanup | void)[];

  /** The node that is actively being hydrated. */
  hydrationNode: Node | null;
  //hn: Node | null;
}

const context: Context = {
  activeEffect: null,
  // TODO: Get rid of this?
  activeEffectSubbed: false,
  objectEffects: new Map<object, Map<string | symbol, Effect[]>>(),
  activeRange: null,
  mountedFunctions: [],
  hydrationNode: null,
  /*
  hn: null,
  get hydrationNode() {
    return this.hn;
  },
  set hydrationNode(value) {
    console.log(`set hydration ${printNode(value)}`);
    this.hn = value;
  },
  */
};

export default context;
