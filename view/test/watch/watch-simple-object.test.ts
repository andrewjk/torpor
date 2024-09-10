import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { proxyStateSymbol } from "../../src/watch/internal/symbols";

test("watching a simple object", () => {
	const input = {
		name: "Andrew",
	};
	const output = $watch(input);
	expect(output[proxyStateSymbol]).not.toBeNull();
});
