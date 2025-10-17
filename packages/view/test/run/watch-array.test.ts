import { expect, test } from "vitest";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("watching an array effect", () => {
	const items = $watch(["h", "i"]);
	let word = "";
	let lastitem = "";
	$run(() => {
		word = items.join("");
	});
	$run(() => {
		lastitem = items[items.length - 1];
	});
	expect(word).toBe("hi");
	expect(lastitem).toBe("i");

	// Push
	items.push("p");
	expect(word).toBe("hip");
	expect(lastitem).toBe("p");
});
