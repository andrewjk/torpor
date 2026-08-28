import type { StandardSchemaV1 } from "../types/StandardSchema";

/**
 * The error thrown when a value fails standard schema validation. The
 * framework turns it into a 422 response for endpoint request bodies.
 */
export default class ValidationError extends Error {
	/**
	 * The issues reported by the schema.
	 */
	issues: ReadonlyArray<StandardSchemaV1.Issue>;

	constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
		super("Validation failed");
		this.name = "ValidationError";
		this.issues = issues;
	}
}
