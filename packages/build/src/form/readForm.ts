/**
 * The values read from a form submission, coerced by the spec's default
 * value types: string defaults produce strings, number defaults produce
 * numbers, boolean defaults produce booleans, array defaults produce
 * arrays of the element type (an empty array default produces strings),
 * and the `File` class produces submitted files (a `[File]` array default
 * produces an array of them).
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
				: [T[number]] extends [typeof File]
					? File[]
					: T[number][]
			: T extends typeof File
				? File | undefined
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
 *   avatar: File,
 *   photos: [File],
 * });
 * // data: {
 *   title: string; done: boolean; priority: number; tags: string[];
 *   avatar: File | undefined; photos: File[]
 * }
 * ```
 *
 * The spec object declares the expected fields; each key's default value
 * determines the type and the fallback when the field is missing or can't be
 * coerced. Booleans follow checkbox semantics (unchecked fields are absent,
 * so they come back as `false`). File inputs are read as `File` values: use
 * the `File` class as the default for a single file (missing when no file
 * was selected), or `[File]` for every submitted file (empty when none).
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
		const values = formData.getAll(key);
		result[key] = Array.isArray(defaultValue)
			? defaultValue[0] === File
				? values.filter((v) => v instanceof File)
				: values.map((value) => coerceValue(toStringValue(value), defaultValue[0]))
			: defaultValue === File
				? values.find((v) => v instanceof File)
				: coerceValue(toStringValue(values[0]), defaultValue);
	}
	return result as FormValues<Spec>;
}

function toStringValue(value: FormDataEntryValue | undefined): string | undefined {
	// oxlint-disable-next-line typescript/no-base-to-string
	return value?.toString();
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
