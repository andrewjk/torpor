import type { FormDataRecord } from "../types/ServerLoadEvent";

/**
 * Converts the submitted fields of a form request into a plain record: one
 * value per field, or an array when a field was submitted with multiple
 * values (e.g. a multi select). File inputs pass through as `File` values;
 * coercing them is left to the schema or the action.
 *
 * @param request The request (or FormData directly)
 * @returns The field values
 */
export default async function formDataToRecord(
	request: Request | FormData,
): Promise<FormDataRecord> {
	const formData = request instanceof FormData ? request : await request.formData();
	const result: FormDataRecord = {};
	for (const key of formData.keys()) {
		if (key in result) continue;
		const values = formData.getAll(key);
		result[key] = values.length > 1 ? values : values[0];
	}
	return result;
}
