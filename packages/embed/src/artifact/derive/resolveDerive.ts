import type { RestrictedRequirement } from "@torpor/view/compile";
import evaluateExpr from "../evaluateExpr";

export interface DeriveLimits {
	/** Maximum input rows a derive may read. Default 5000. */
	maxInputRows?: number;
	/** Maximum rows a derive may output. Default 1000. */
	maxOutputRows?: number;
	/** Wall-clock budget in milliseconds. Default 50. */
	timeoutMs?: number;
}

const DEFAULT_MAX_INPUT_ROWS = 5000;
const DEFAULT_MAX_OUTPUT_ROWS = 1000;
const DEFAULT_TIMEOUT_MS = 50;

type Formatters = Record<string, (...args: unknown[]) => unknown>;

/**
 * Resolves a `data <name> from derive { … }` requirement: filters, maps,
 * sorts and limits an earlier requirement's rows, using the artifact
 * expression language (with host function calls available for formatting).
 * With an aggregate (`count`/`sum`/`min`/`max`/`average`), returns a single
 * object keyed by the aggregates instead of rows.
 *
 * Runs with budgets (input rows, output rows, wall clock) because it is the
 * one place the data layer can iterate. Joins are deliberately absent —
 * correlate in the template or in a host-shaped source.
 */
export default function resolveDerive(
	requirement: RestrictedRequirement,
	data: Record<string, unknown>,
	props: Record<string, any>,
	formatters: Formatters | undefined,
	limits?: DeriveLimits,
): unknown {
	const maxInputRows = limits?.maxInputRows ?? DEFAULT_MAX_INPUT_ROWS;
	const maxOutputRows = limits?.maxOutputRows ?? DEFAULT_MAX_OUTPUT_ROWS;
	const timeoutMs = limits?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	const spec = requirement.spec;

	const ofName =
		spec.of?.op === "lit" && typeof spec.of.value === "string" ? spec.of.value : undefined;
	if (ofName === undefined) {
		throw new Error(`derive "${requirement.name}" needs an "of" data name.`);
	}

	if (!Object.prototype.hasOwnProperty.call(data, ofName)) {
		throw new Error(
			`derive "${requirement.name}" reads "${ofName}", which no earlier requirement provided. Use an earlier data name.`,
		);
	}
	const input = data[ofName];
	if (!Array.isArray(input)) {
		throw new Error(
			`derive "${requirement.name}" expects "${ofName}" to be an array (got ${describe(input)}).`,
		);
	}
	if (input.length > maxInputRows) {
		throw new Error(
			`derive "${requirement.name}" input has ${input.length} rows, over the ${maxInputRows} row budget. Filter in the source or raise deriveLimits.maxInputRows.`,
		);
	}

	const deadline = Date.now() + timeoutMs;

	// Aggregate form: any of count/sum/min/max/average in the spec produces a
	// single object (keyed by the aggregates) over the rows passing `where`.
	// Nulls/undefined are skipped per SQL semantics; `count` counts filtered
	// rows regardless. Must match AGGREGATE_KEYS in deriveRequirementKind.
	const aggregateKeys = Object.keys(spec).filter((key) =>
		["count", "sum", "min", "max", "average"].includes(key),
	);
	if (aggregateKeys.length > 0) {
		let count = 0;
		let sumTotal = 0;
		let averageTotal = 0;
		let averageCount = 0;
		let min: unknown;
		let max: unknown;
		for (let index = 0; index < input.length; index++) {
			if (Date.now() > deadline) {
				throw new Error(
					`derive "${requirement.name}" exceeded its ${timeoutMs}ms budget after ${index} rows.`,
				);
			}
			const scope: Record<string, unknown> = {
				$props: props,
				$item: input[index],
				$index: index,
			};
			if (spec.where !== undefined && !evaluateExpr(spec.where, scope, formatters)) {
				continue;
			}
			count++;
			for (const key of aggregateKeys) {
				if (key === "count") continue;
				const value = evaluateExpr(spec[key], scope, formatters);
				if (value === null || value === undefined) continue;
				if (key === "sum" || key === "average") {
					if (typeof value !== "number" || Number.isNaN(value)) {
						throw new Error(
							`derive "${requirement.name}" ${key} must evaluate to a number (got ${describe(value)}).`,
						);
					}
					if (key === "sum") sumTotal += value;
					else {
						averageTotal += value;
						averageCount++;
					}
				} else if (key === "min") {
					min = min === undefined || compareKeys(value, min) < 0 ? value : min;
				} else {
					max = max === undefined || compareKeys(value, max) > 0 ? value : max;
				}
			}
		}
		const totals: Record<string, unknown> = {};
		for (const key of aggregateKeys) {
			if (key === "count") totals.count = count;
			else if (key === "sum") totals.sum = sumTotal;
			else if (key === "average")
				totals.average = averageCount > 0 ? averageTotal / averageCount : null;
			else if (key === "min") totals.min = min === undefined ? null : min;
			else totals.max = max === undefined ? null : max;
		}
		return totals;
	}

	const orderName = spec.order?.op === "lit" && spec.order.value === "desc" ? -1 : 1;

	const kept: { value: unknown; key: unknown; index: number }[] = [];
	for (let index = 0; index < input.length; index++) {
		if (Date.now() > deadline) {
			throw new Error(
				`derive "${requirement.name}" exceeded its ${timeoutMs}ms budget after ${index} rows.`,
			);
		}
		const scope: Record<string, unknown> = {
			$props: props,
			$item: input[index],
			$index: index,
		};
		if (spec.where !== undefined && !evaluateExpr(spec.where, scope, formatters)) {
			continue;
		}
		const value = spec.map !== undefined ? evaluateExpr(spec.map, scope, formatters) : input[index];
		const key =
			spec.sortBy !== undefined ? evaluateExpr(spec.sortBy, scope, formatters) : undefined;
		kept.push({ value, key, index });
	}

	if (spec.sortBy !== undefined) {
		kept.sort((a, b) => {
			const compared = compareKeys(a.key, b.key) * orderName;
			// Stable: ties fall back to the original order
			return compared !== 0 ? compared : a.index - b.index;
		});
	}

	const specLimit =
		spec.limit?.op === "lit" && typeof spec.limit.value === "number" && spec.limit.value > 0
			? spec.limit.value
			: maxOutputRows;
	const limit = Math.min(specLimit, maxOutputRows);
	return kept.slice(0, limit).map((entry) => entry.value);
}

function compareKeys(a: unknown, b: unknown): number {
	if (a === b) return 0;
	if (typeof a === "number" && typeof b === "number") return a - b;
	const as = sortKeyString(a);
	const bs = sortKeyString(b);
	return as < bs ? -1 : as > bs ? 1 : 0;
}

function sortKeyString(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	throw new Error(`derive sortBy must evaluate to a primitive (got ${typeof value}).`);
}

function describe(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "an array";
	return typeof value;
}
