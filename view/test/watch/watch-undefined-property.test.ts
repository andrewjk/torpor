import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";

test("watching an undefined property", () => {
	const input = {};
	const output = $watch(input);
	// @ts-ignore
	expect(output.name).toBe(undefined);
});
