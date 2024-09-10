import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { proxyStateSymbol } from "../../src/watch/internal/symbols";

test("watching a nested object", () => {
	const input = {
		person: {
			name: "Andrew",
		},
	};
	const output = $watch(input);
	expect(output[proxyStateSymbol]).not.toBeNull();
	expect(output.person[proxyStateSymbol]).not.toBeNull();
});
