/**
 * A function that may be returned from an effect, and is run before the effect
 * is run or destroyed
 */
export type Cleanup = () => void;
