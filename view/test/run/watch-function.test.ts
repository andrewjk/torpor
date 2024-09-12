import { expect, test } from "vitest";
import $run from "../../src/$run";
import $watch from "../../src/$watch";

test("watching a function effect", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
		fullName: function () {
			return `${this.firstName} ${this.lastName}`;
		},
	});
	let greeting = "";
	const effect = $run(() => {
		greeting = `Hi, ${person.fullName()}!`;
	});
	expect(greeting).toBe("Hi, Andrew Smith!");
	person.firstName = "John";
	expect(greeting).toBe("Hi, John Smith!");
});
