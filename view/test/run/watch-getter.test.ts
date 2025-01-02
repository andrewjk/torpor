import { expect, test } from "vitest";
import $run from "../../src/render/$run";
import $watch from "../../src/render/$watch";

test("watching a getter effect", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
		get fullName() {
			return `${this.firstName} ${this.lastName}`;
		},
	});
	let greeting = "";
	const effect = $run(() => {
		greeting = `Hi, ${person.fullName}!`;
	});
	expect(greeting).toBe("Hi, Andrew Smith!");
	person.firstName = "John";
	expect(greeting).toBe("Hi, John Smith!");
});
