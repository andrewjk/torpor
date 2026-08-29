import { skipStringOrComment } from "./codeScanner";

/**
 * Builds the statements that write a component's prop value back to the
 * expression it is bound to (e.g. for `&name={$state.user?.name}`).
 *
 * The bound expression may use optional chaining, which can't be assigned to
 * directly. In that case the write is compiled to a guarded assignment: the
 * prop value is read first (so the write re-runs when the child changes it),
 * the target object is read with `$peek` (so that replacing it doesn't re-run
 * the write with a stale prop value), and the value is written through it
 * when it exists:
 *
 * ```
 * bindingTarget("$state.user?.name", `props["name"]`, "name", imports)
 * // => const t_bind_name = props["name"];
 * //      const t_target_name = $peek(() => $state.user);
 * //      if (t_target_name != null) t_target_name.name = t_bind_name;
 * ```
 *
 * @param value The bound expression
 * @param right The value to assign to it
 * @param name The prop name, used to make the temp variable names unique
 * @param imports The set of runtime imports to add `$peek` to when the
 *   expression needs a guarded write
 *
 * @returns The assignment statements
 */
export default function bindingTarget(
	value: string,
	right: string,
	name: string,
	imports?: Set<string>,
): string {
	// Find the optional chains in the expression, keeping track of the last
	// chain so that the write can be guarded on it
	let lastChainStart = -1;

	for (let i = 0; i < value.length; i++) {
		let char = value[i];
		if (char === '"' || char === "'" || char === "`" || char === "/") {
			// Skip strings, template strings, comments and regex literals
			const skipped = skipStringOrComment(value, i);
			if (skipped !== -1) {
				i = skipped - 1;
				continue;
			}
		}
		if (char === "?" && value[i + 1] === "." && !/[0-9]/.test(value[i + 2] ?? "")) {
			// NOTE: `?.` followed by a digit is a ternary (e.g. `a ?.5 : b`),
			// not an optional chain
			let next = value[i + 2];
			if (next === "(") {
				throw new Error(
					`Cannot bind to "${value}": optional calls are not supported in binding expressions`,
				);
			}
			lastChainStart = i;
			if (next === "[") {
				// Skip the whole `?.` -- `a?.[key]` becomes `a[key]`
				i += 1;
			}
			// Otherwise skip just the `?` -- `a?.name` becomes `a.name`
			continue;
		}
	}

	if (lastChainStart === -1) {
		return `${value} = ${right};`;
	}

	// The guard reads the chain up to (but not including) its last link. If
	// that isn't nullish, no link in the chain is, so the write is safe --
	// optional chaining short-circuits the whole chain when a link is missing
	let guard = value.substring(0, lastChainStart);
	// The part after the last `?.` -- `.name` for a property access, `[key]`
	// for a computed one
	let next = value[lastChainStart + 2];
	if (next !== "[" && !/[A-Za-z0-9_$]/.test(next ?? "")) {
		// e.g. a chain nested inside a computed key (`a?.[b?.c]`) splits the
		// expression in a place that can't be assigned to
		throw new Error(`Cannot bind to "${value}": unsupported optional chain in binding expression`);
	}
	let suffix = value.substring(lastChainStart + (next === "[" ? 2 : 1));
	let varSuffix = name.replace(/[^a-zA-Z0-9_$]/g, "_");
	imports?.add("$peek");
	return (
		`const t_bind_${varSuffix} = ${right};\n` +
		`const t_target_${varSuffix} = $peek(() => ${guard});\n` +
		`if (t_target_${varSuffix} != null) t_target_${varSuffix}${suffix} = t_bind_${varSuffix};`
	);
}
