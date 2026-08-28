/**
 * The Standard Schema interface, per the spec at https://standardschema.dev.
 *
 * It is implemented by Zod, Valibot, ArkType, Effect Schema and others, so
 * endpoints can validate request bodies with whichever library they prefer
 * without this package depending on any of them.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
	readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
	/** The Standard Schema props interface. */
	export interface Props<Input = unknown, Output = Input> {
		/**
		 * The Standard Schema version.
		 */
		readonly version: 1;
		/**
		 * The vendor name of the schema library.
		 */
		readonly vendor: string;
		/**
		 * Validates unknown input values and returns the parsed output.
		 */
		readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
		/**
		 * Inferred types associated with the schema.
		 */
		readonly types?: Types<Input, Output> | undefined;
	}

	/**
	 * The result of a validation: a success with a value, or a failure with
	 * issues.
	 */
	export type Result<Output> = SuccessResult<Output> | FailureResult;

	/**
	 * The result of a successful validation.
	 */
	export interface SuccessResult<Output> {
		/**
		 * The typed output value.
		 */
		readonly value: Output;
		/**
		 * Only set when there are issues, so a success can be tested with
		 * `if (result.issues)`.
		 */
		readonly issues?: undefined;
	}

	/**
	 * The result of a failed validation.
	 */
	export interface FailureResult {
		/**
		 * The issues detected during validation.
		 */
		readonly issues: ReadonlyArray<Issue>;
	}

	/**
	 * An issue encountered during validation.
	 */
	export interface Issue {
		/**
		 * The error message.
		 */
		readonly message: string;
		/**
		 * The path to the property the issue belongs to.
		 */
		readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
	}

	/**
	 * A segment of the path to an issue.
	 */
	export interface PathSegment {
		/**
		 * The key of the property.
		 */
		readonly key: PropertyKey;
	}

	/**
	 * The input and output types inferred from a schema.
	 */
	export interface Types<Input = unknown, Output = Input> {
		readonly input: Input;
		readonly output: Output;
	}

	/**
	 * Infers the input type of a schema.
	 */
	export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
		Schema["~standard"]["types"]
	>["input"];

	/**
	 * Infers the output type of a schema.
	 */
	export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
		Schema["~standard"]["types"]
	>["output"];
}
