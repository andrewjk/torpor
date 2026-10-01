/**
 * A loop variable exposed by an enclosing `@for`, plus the path to its live
 * position in the row's data bag that the compiler resolves references
 * against.
 *
 * - `shadow: true` — the variable is never written in the loop body, so
 *   references resolve lexically against a per-scope binding
 *   (`const <name> = <path>;`) the compiler emits at the top of every
 *   reactive scope inside the body.
 * - `shadow: false` — the variable is written somewhere in the body (e.g.
 *   `&value={x}`), so references are textually substituted to `<path>` and
 *   writes propagate through the data bag.
 */
export default interface ForVar {
	name: string;
	path: string;
	shadow: boolean;
}
