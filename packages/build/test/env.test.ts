import { afterEach, describe, expect, test } from "vite-plus/test";
import env, { setEnvSchema } from "../src/env";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";

declare global {
	interface TorporEnv {
		TOKEN?: string;
		A?: string;
		RAW?: string;
	}
}

const globalRef = globalThis as { adapter?: { env?: unknown } };

afterEach(() => {
	setEnvSchema(undefined);
	delete globalRef.adapter;
});

function stubSchema(
	validate: StandardSchemaV1<unknown, TorporEnv>["~standard"]["validate"],
): StandardSchemaV1<unknown, TorporEnv> {
	return { "~standard": { version: 1, vendor: "test", validate } };
}

describe("env", () => {
	test("returns the adapter environment when no schema is set", () => {
		const source = { JWT_SECRET: "s3cret" };
		globalRef.adapter = { env: source };
		expect(env()).toEqual(source);
	});

	test("throws when the environment is not available", () => {
		expect(() => env()).toThrow(/environment is not available/);
	});

	test("throws when the adapter env is not an object", () => {
		globalRef.adapter = { env: undefined };
		expect(() => env()).toThrow(/environment is not available/);
	});

	test("returns the parsed value when a schema is set", () => {
		globalRef.adapter = { env: { TOKEN: "  abc  " } };
		setEnvSchema(
			stubSchema((value) => ({
				value: { TOKEN: (value as { TOKEN: string }).TOKEN.trim() },
			})),
		);
		expect(env().TOKEN).toBe("abc");
	});

	test("throws with the schema's message when validation fails", () => {
		globalRef.adapter = { env: {} };
		setEnvSchema(stubSchema(() => ({ issues: [{ message: "JWT_SECRET is required" }] })));
		expect(() => env()).toThrow("The environment is invalid: JWT_SECRET is required");
	});

	test("rejects a schema that validates asynchronously", () => {
		globalRef.adapter = { env: {} };
		setEnvSchema(stubSchema(() => Promise.resolve({ value: {} })));
		expect(() => env()).toThrow(/must validate synchronously/);
	});

	test("validates once per env object", () => {
		globalRef.adapter = { env: { A: "1" } };
		let calls = 0;
		setEnvSchema(
			stubSchema((value) => {
				calls++;
				return { value: value as TorporEnv };
			}),
		);
		env();
		env();
		env();
		expect(calls).toBe(1);
	});

	test("validates again when the env object changes", () => {
		globalRef.adapter = { env: { A: "1" } };
		let calls = 0;
		setEnvSchema(
			stubSchema((value) => {
				calls++;
				return { value: value as TorporEnv };
			}),
		);
		env();
		globalRef.adapter = { env: { A: "2" } };
		env();
		expect(calls).toBe(2);
		expect(env().A).toBe("2");
	});

	test("does not validate when the schema is removed", () => {
		globalRef.adapter = { env: { RAW: "yes" } };
		setEnvSchema(stubSchema(() => ({ issues: [{ message: "nope" }] })));
		setEnvSchema(undefined);
		expect(env().RAW).toBe("yes");
	});
});
