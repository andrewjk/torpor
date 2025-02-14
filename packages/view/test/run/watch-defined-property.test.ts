import { expect, test } from "vitest";
import $run from "../../src/render/$run";
import $watch from "../../src/render/$watch";

test("watching a defined property effect", () => {
	let person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
	});

	person = Object.defineProperty(person, "fullName", {
		get: () => {
			return `${person.firstName} ${person.lastName}`;
		},
	});

	let greeting = "";
	$run(() => {
		// @ts-ignore TODO
		greeting = `Hi, ${person.fullName}!`;
	});
	expect(greeting).toBe("Hi, Andrew Smith!");
	person.firstName = "John";
	expect(greeting).toBe("Hi, John Smith!");
});
