/**
 * A loop variable exposed by an enclosing `@for`, plus the path to its live
 * position in the row's data bag that the compiler resolves references
 * against.
 *
 * Loop variables are read-only: references resolve lexically against a
 * per-scope binding (`const <name> = <path>;`) the compiler emits at the top
 * of every reactive scope inside the body. A bare write to the binding in the
 * body is a compile error (see `buildForNode`), so `shadow` is currently
 * always true; it is retained on the type for the masking logic.
 */
export default interface ForVar {
	name: string;
	path: string;
	shadow: boolean;
}
