/**
 * The values read from a form submission, coerced by the spec's default
 * value types: string defaults produce strings, number defaults produce
 * numbers, boolean defaults produce booleans, and array defaults produce
 * arrays of the element type (an empty array default produces strings).
 */
export type FormValues<Spec extends Record<string, unknown>> = {
	[K in keyof Spec]: FormValue<Spec[K]>;
};

type FormValue<T> = T extends boolean
	? boolean
	: T extends number
		? number
		: T extends readonly unknown[]
			? [T[number]] extends [never]
				? string[]
				: T[number][]
			: string;

/**
 * Reads and coerces the submitted fields of a form action, e.g.
 *
 * ```ts
 * const data = await readForm(request, {
 *   title: "",
 *   done: false,
 *   priority: 0,
 *   tags: [],
 * });
 * // data: { title: string; done: boolean; priority: number; tags: string[] }
 * ```
 *
 * The spec object declares the expected fields; each key's default value
 * determines the type and the fallback when the field is missing or can't be
 * coerced. Booleans follow checkbox semantics (unchecked fields are absent,
 * so they come back as `false`).
 *
 * @param request The action event's request, or its FormData directly
 * @param spec An object mapping field names to default values
 * @returns The coerced field values
 */
export default async function readForm<Spec extends Record<string, unknown>>(
	request: Request | FormData,
	spec: Spec,
): Promise<FormValues<Spec>> {
	const formData = request instanceof FormData ? request : await request.formData();
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(spec)) {
		const defaultValue = spec[key];
		const values = formData.getAll(key).map((v) => v.toString());
		result[key] = Array.isArray(defaultValue)
			? values.map((value) => coerceValue(value, defaultValue[0]))
			: coerceValue(values[0], defaultValue);
	}
	return result as FormValues<Spec>;
}

function coerceValue(value: string | undefined, defaultValue: unknown): unknown {
	if (typeof defaultValue === "number") {
		const n = value === undefined || value === "" ? NaN : Number(value);
		return Number.isNaN(n) ? defaultValue : n;
	}
	if (typeof defaultValue === "boolean") {
		// Unchecked checkboxes are not submitted at all
		if (value === undefined) return false;
		return !(value === "" || value === "false" || value === "off");
	}
	return value ?? defaultValue ?? "";
}
