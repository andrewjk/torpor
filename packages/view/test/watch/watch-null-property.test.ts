import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";

test("watching a null property", () => {
	const input = {
		name: null,
	};
	const output = $watch(input);
	expect(output.name).toBe(null);
});
