import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watching a simple object", () => {
	const input = {
		name: "Andrew",
	};
	const output = $watch(input);
	// @ts-ignore
	expect(output[proxyDataSymbol]).not.toBeNull();
});
