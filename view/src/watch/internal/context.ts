type EffectFunction = () => void;
type PropertyEffectsMap = Map<string | symbol, Set<EffectFunction>>;
type NodeEffectsSet = Set<{ target: object; prop: string | symbol; effect: EffectFunction }>;
type NodeEffects = { children: Node[]; effects: NodeEffectsSet };

interface Context {
  activeEffect?: EffectFunction;
  effectSubscriptions: Map<object, PropertyEffectsMap>;

  activeNode?: Node;
  nodeEffects: Map<Node, NodeEffects>;
}

/**
 * The global context for setting up effects and updating subscriptions.
 */
const context: Context = {
  /**
   * A map of objects, their properties, and the object/property effects.
   *
   * When a property of a proxied object (created via the watch function) is changed, we look up
   * the object, then the property, and run any effects that are found.
   */
  effectSubscriptions: new Map<object, PropertyEffectsMap>(),
  /**
   * A map of nodes and the object/property/effects attached to them.
   *
   * This is used to remove effects from the effectSubscriptions map when a node is removed.
   */
  nodeEffects: new Map<Node, NodeEffects>(),
};

export default context;
