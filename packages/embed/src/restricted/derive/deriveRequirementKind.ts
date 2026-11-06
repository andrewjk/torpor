import type {
	RestrictedExpr,
	RestrictedRequirementKindValidator,
	RestrictedSpecEntry,
} from "@torpor/view/compile";

/**
 * The compile-time shape of `data <name> from derive { … }` declarations.
 *
 * ```torp
 * data view from derive {
 * 	of: "tickets",                                    // earlier requirement (array)
 * 	where: $item.priority >= 2,                       // optional per-row filter
 * 	map: { due: formatDue($item.due) },               // optional per-row shaping
 * 	sortBy: $item.priority,                           // optional sort key
 * 	order: "desc",                                    // "asc" (default) | "desc"
 * 	limit: 20,
 * };
 * ```
 *
 * This is the one data-layer construct whose expressions are evaluated per
 * row; host formatters are callable here (and in requirement specs), never
 * in template expressions.
 */
const DERIVE_SPEC_KEYS = new Set(["of", "where", "map", "sortBy", "order", "limit"]);

function literalString(entry: RestrictedSpecEntry | undefined): string | undefined {
	if (entry === undefined) return undefined;
	return entry.expr.op === "lit" && typeof entry.expr.value === "string"
		? entry.expr.value
		: undefined;
}

const deriveRequirementKind: RestrictedRequirementKindValidator = (entries, report, context) => {
	const byKey = new Map(entries.map((entry) => [entry.key, entry]));

	for (const entry of entries) {
		if (!DERIVE_SPEC_KEYS.has(entry.key)) {
			report(
				`Unknown derive spec key "${entry.key}". Allowed: of, where, map, sortBy, order, limit.`,
				entry.keyStart,
				entry.valueEnd,
			);
		}
	}

	const ofEntry = byKey.get("of");
	if (ofEntry === undefined) {
		report('derive requirements need an "of" data name.', 0, 0);
	} else {
		const ofName = literalString(ofEntry);
		if (ofName === undefined) {
			report(
				'derive "of" must be a string literal naming an earlier requirement.',
				ofEntry.valueStart,
				ofEntry.valueEnd,
			);
		} else if (context !== undefined && !context.names.includes(ofName)) {
			report(
				`derive "of" references "${ofName}", which is not an earlier requirement. Requirements resolve in order; declare "${ofName}" before this derive.`,
				ofEntry.valueStart,
				ofEntry.valueEnd,
			);
		}
	}

	const orderEntry = byKey.get("order");
	if (orderEntry !== undefined) {
		const order = literalString(orderEntry);
		if (order !== "asc" && order !== "desc") {
			report('derive "order" must be "asc" or "desc".', orderEntry.valueStart, orderEntry.valueEnd);
		}
	}

	const limitEntry = byKey.get("limit");
	if (limitEntry !== undefined) {
		const value = limitEntry.expr.op === "lit" ? limitEntry.expr.value : undefined;
		if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
			report(
				'derive "limit" must be a positive integer literal.',
				limitEntry.valueStart,
				limitEntry.valueEnd,
			);
		}
	}

	for (const key of ["where", "map", "sortBy"]) {
		const entry = byKey.get(key);
		if (entry !== undefined && !isExpression(entry.expr)) {
			report(`derive "${key}" must be an expression.`, entry.valueStart, entry.valueEnd);
		}
	}
};

function isExpression(expr: RestrictedExpr): boolean {
	return typeof expr === "object" && expr !== null && typeof expr.op === "string";
}

export default deriveRequirementKind;
