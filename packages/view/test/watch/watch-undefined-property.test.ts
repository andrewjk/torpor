import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";

test("watching an undefined property", () => {
	const input = {};
	const output = $watch(input);
	// @ts-ignore
	expect(output.name).toBe(undefined);
});
