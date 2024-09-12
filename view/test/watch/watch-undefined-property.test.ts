import { expect, test } from "vitest";
import $watch from "../../src/$watch";

test("watching an undefined property", () => {
	const input = {};
	const output = $watch(input);
	// @ts-ignore
	expect(output.name).toBe(undefined);
});
