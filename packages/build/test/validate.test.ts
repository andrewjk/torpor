import { describe, expect, test } from "vite-plus/test";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";
import ValidationError from "../src/validation/ValidationError";
import validate from "../src/validation/validate";

/**
 * A minimal standard schema, as a schema library would implement it.
 */
function schema<I, O>(
	validateFn: (value: unknown) => StandardSchemaV1.Result<O>,
): StandardSchemaV1<I, O> {
	return {
		"~standard": {
			version: 1,
			vendor: "test",
			validate: validateFn,
			types: { input: undefined as I, output: undefined as O },
		},
	};
}

const stringSchema = schema<unknown, string>((value) =>
	typeof value === "string"
		? { value }
		: { issues: [{ message: "not a string", path: [{ key: "title" }] }] },
);

const postSchema = schema<unknown, { title: string; views: number }>((value) => {
	const post = value as { title?: unknown; views?: unknown };
	const issues: StandardSchemaV1.Issue[] = [];
	if (typeof post.title !== "string") issues.push({ message: "title is required" });
	if (typeof post.views !== "number") issues.push({ message: "views is required" });
	if (issues.length > 0) return { issues };
	return { value: { title: post.title, views: post.views } };
});

const asyncSchema = schema<unknown, number>(async (value) => ({ value: Number(value) }));

describe("validate", () => {
	test("returns the parsed value on success", async () => {
		const result = await validate(stringSchema, "hello");
		expect(result).toBe("hello");
	});

	test("parses and transforms the value", async () => {
		const result = await validate(postSchema, { title: "Hello", views: 5 });
		expect(result).toEqual({ title: "Hello", views: 5 });
	});

	test("throws a ValidationError with the schema's issues on failure", async () => {
		try {
			await validate(postSchema, { title: 1 });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			const validationError = error as ValidationError;
			expect(validationError.message).toBe("Validation failed");
			expect(validationError.issues).toHaveLength(2);
			expect(validationError.issues.map((i) => i.message)).toEqual([
				"title is required",
				"views is required",
			]);
		}
	});

	test("includes issue paths", async () => {
		try {
			await validate(stringSchema, 123);
			expect.unreachable();
		} catch (error) {
			const issue = (error as ValidationError).issues[0];
			expect(issue.path).toEqual([{ key: "title" }]);
		}
	});

	test("supports async schemas", async () => {
		const result = await validate(asyncSchema, "42");
		expect(result).toBe(42);
	});
});
