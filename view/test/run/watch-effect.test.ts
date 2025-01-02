import { expect, test } from "vitest";
import $run from "../../src/render/$run";
import $watch from "../../src/render/$watch";

test("watching a simple effect", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
	});
	let fullName = "";
	const effect = $run(() => {
		fullName = `${person.firstName} ${person.lastName}`;
	});
	expect(fullName).toBe("Andrew Smith");
	person.firstName = "John";
	expect(fullName).toBe("John Smith");
});
