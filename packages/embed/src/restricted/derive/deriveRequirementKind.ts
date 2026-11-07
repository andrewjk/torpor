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
 * Aggregate form — returns a single object instead of rows:
 *
 * ```torp
 * data stats from derive {
 * 	of: "tickets",
 * 	where: $item.open,                                // optional filter
 * 	count: true,                                      // rows passing the filter
 * 	sum: $item.estimate,                              // numeric aggregates
 * 	average: $item.estimate,
 * 	min: $item.due,
 * 	max: $item.priority,
 * };
 * ```
 *
 * This is the one data-layer construct whose expressions are evaluated per
 * row; host formatters are callable here (and in requirement specs), never
 * in template expressions.
 */
const DERIVE_SPEC_KEYS = new Set([
	"of",
	"where",
	"map",
	"sortBy",
	"order",
	"limit",
	// Aggregates — produce a single object; can't combine with the row pipeline
	"count",
	"sum",
	"min",
	"max",
	"average",
]);
const AGGREGATE_KEYS = new Set(["count", "sum", "min", "max", "average"]);
const PIPELINE_KEYS = new Set(["map", "sortBy", "order", "limit"]);

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

	// Aggregates produce a single object, so the row pipeline (map/sort/
	// limit) doesn't apply. `where` still filters the rows being aggregated.
	const aggregates = [...AGGREGATE_KEYS].filter((key) => byKey.has(key));
	if (aggregates.length > 0) {
		for (const key of PIPELINE_KEYS) {
			const entry = byKey.get(key);
			if (entry !== undefined) {
				report(
					`Aggregates (${aggregates.join(", ")}) produce a single value, so "${key}" doesn't apply. Split into two derives or drop the aggregate.`,
					entry.valueStart,
					entry.valueEnd,
				);
			}
		}
	}

	const countEntry = byKey.get("count");
	if (countEntry !== undefined) {
		const value = countEntry.expr.op === "lit" ? countEntry.expr.value : undefined;
		if (value !== true) {
			report(
				'derive "count" must be literal true (it counts the rows passing "where").',
				countEntry.valueStart,
				countEntry.valueEnd,
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

	for (const key of ["where", "map", "sortBy", "sum", "min", "max", "average"]) {
		const entry = byKey.get(key);
		if (entry === undefined) continue;
		// Pipeline keys are already reported when aggregates are present
		if (aggregates.length > 0 && PIPELINE_KEYS.has(key)) continue;
		if (!isExpression(entry.expr)) {
			report(`derive "${key}" must be an expression.`, entry.valueStart, entry.valueEnd);
		}
	}
};

function isExpression(expr: RestrictedExpr): boolean {
	return typeof expr === "object" && expr !== null && typeof expr.op === "string";
}

export default deriveRequirementKind;
