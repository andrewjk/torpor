import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watching a simple object", () => {
	const input = {
		name: "Andrew",
	};
	const output = $watch(input);
	expect(output[proxyDataSymbol]).not.toBeNull();
});
