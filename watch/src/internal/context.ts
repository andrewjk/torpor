/**
 * The global context for setting up effects and updating subscriptions
 */
const context: {
  activeEffect?: () => void;
  subscriptions: WeakMap<object, Map<string, Set<() => void>>>;
} = {
  subscriptions: new WeakMap<object, Map<string, Set<() => void>>>(),
};

export default context;
