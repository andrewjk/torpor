import type { RestrictedExpr } from "@torpor/view/compile";

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Evaluates a serialized artifact expression against a scope.
 *
 * This is the whole "interpreter" for expressions: switch on the op set and
 * apply JS semantics. It never compiles or evals code — the ops are the
 * complete vocabulary. Unknown identifiers (an artifact referencing
 * something the host didn't provide) throw with context rather than
 * producing silent `undefined`s.
 */
export default function evaluateExpr(
	expr: RestrictedExpr,
	scope: Record<string, unknown>,
	functions?: Record<string, (...args: unknown[]) => unknown>,
): unknown {
	switch (expr.op) {
		case "lit":
			return expr.value;

		case "ref": {
			if (!Object.prototype.hasOwnProperty.call(scope, expr.name)) {
				throw new Error(
					`Unknown identifier "${expr.name}" in artifact expression. Available: ${Object.keys(scope).join(", ")}.`,
				);
			}
			return scope[expr.name];
		}

		case "get": {
			if (DANGEROUS_KEYS.has(expr.key)) {
				throw new Error(`Dangerous property name "${expr.key}" in artifact expression.`);
			}
			const object = evaluateExpr(expr.object, scope, functions);
			if (object === null || object === undefined) {
				if (expr.optional) return undefined;
				throw new TypeError(
					`Cannot read properties of ${object} (reading "${expr.key}") in artifact expression.`,
				);
			}
			return (object as Record<string, unknown>)[expr.key];
		}

		case "index": {
			const object = evaluateExpr(expr.object, scope, functions);
			const index = evaluateExpr(expr.index, scope, functions);
			if (object === null || object === undefined) {
				if (expr.optional) return undefined;
				throw new TypeError(
					`Cannot read properties of ${object} (reading "${String(index)}") in artifact expression.`,
				);
			}
			if (typeof index === "string" && DANGEROUS_KEYS.has(index)) {
				throw new Error(`Dangerous property name "${index}" in artifact expression.`);
			}
			return (object as Record<string | number, unknown>)[index as string | number];
		}

		case "call": {
			if (functions === undefined || !Object.prototype.hasOwnProperty.call(functions, expr.name)) {
				throw new Error(
					`Unknown host function "${expr.name}" in artifact expression. Available: ${Object.keys(functions ?? {}).join(", ") || "(none)"}.`,
				);
			}
			const fn = functions[expr.name];
			if (typeof fn !== "function") {
				throw new Error(`Host function "${expr.name}" is not a function.`);
			}
			return fn(...expr.args.map((arg) => evaluateExpr(arg, scope, functions)));
		}

		case "unary": {
			const operand = evaluateExpr(expr.operand, scope, functions);
			switch (expr.operator) {
				case "!":
					return !operand;
				case "-":
					return -(operand as number);
				case "+":
					return +(operand as number);
				case "typeof":
					return typeof operand;
			}
		}

		case "binary": {
			if (expr.operator === "&&" || expr.operator === "||" || expr.operator === "??") {
				const left = evaluateExpr(expr.left, scope, functions);
				if (expr.operator === "&&") return left ? evaluateExpr(expr.right, scope, functions) : left;
				if (expr.operator === "||") return left ? left : evaluateExpr(expr.right, scope, functions);
				return left !== null && left !== undefined
					? left
					: evaluateExpr(expr.right, scope, functions);
			}
			const left = evaluateExpr(expr.left, scope, functions) as never;
			const right = evaluateExpr(expr.right, scope, functions) as never;
			switch (expr.operator) {
				case "==":
					// eslint-disable-next-line eqeqeq
					return left == right;
				case "!=":
					// eslint-disable-next-line eqeqeq
					return left != right;
				case "===":
					return left === right;
				case "!==":
					return left !== right;
				case "<":
					return left < right;
				case "<=":
					return left <= right;
				case ">":
					return left > right;
				case ">=":
					return left >= right;
				case "+":
					return (left as unknown as number) + (right as unknown as number);
				case "-":
					return (left as unknown as number) - (right as unknown as number);
				case "*":
					return (left as unknown as number) * (right as unknown as number);
				case "/":
					return (left as unknown as number) / (right as unknown as number);
				case "%":
					return (left as unknown as number) % (right as unknown as number);
			}
			throw new Error(`Unknown binary operator "${String(expr.operator)}"`);
		}

		case "ternary":
			return evaluateExpr(expr.test, scope, functions)
				? evaluateExpr(expr.consequent, scope, functions)
				: evaluateExpr(expr.alternate, scope, functions);

		case "array":
			return expr.items.map((item) => evaluateExpr(item, scope, functions));

		case "object": {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(expr.entries)) {
				if (DANGEROUS_KEYS.has(key)) {
					throw new Error(`Dangerous property name "${key}" in artifact expression.`);
				}
				result[key] = evaluateExpr(value, scope, functions);
			}
			return result;
		}
	}
}
