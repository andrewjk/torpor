/**
 * A function that may be returned from an effect, and is run before the effect
 * is run or destroyed
 */
type Cleanup = () => void;

export default Cleanup;
