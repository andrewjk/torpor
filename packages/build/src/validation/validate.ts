import type { StandardSchemaV1 } from "../types/StandardSchema";
import ValidationError from "./ValidationError";

/**
 * Validates a value against a standard schema (zod, valibot, arktype, etc),
 * returning the parsed value, or throwing a `ValidationError` with the
 * schema's issues.
 *
 * ```ts
 * const post = validate(postSchema, { title: "Hello" });
 * ```
 *
 * @param schema A schema implementing the Standard Schema interface
 * @param value The value to validate
 * @returns The parsed value
 */
export default async function validate<Schema extends StandardSchemaV1>(
	schema: Schema,
	value: unknown,
): Promise<StandardSchemaV1.InferOutput<Schema>> {
	const result = await schema["~standard"].validate(value);
	if (result.issues) {
		throw new ValidationError(result.issues);
	}
	return result.value as StandardSchemaV1.InferOutput<Schema>;
}
