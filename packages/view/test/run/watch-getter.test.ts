import { expect, test } from "vitest";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("watching a getter effect", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
		get fullName() {
			return `${this.firstName} ${this.lastName}`;
		},
	});
	let greeting = "";
	$run(() => {
		greeting = `Hi, ${person.fullName}!`;
	});
	expect(greeting).toBe("Hi, Andrew Smith!");
	person.firstName = "John";
	expect(greeting).toBe("Hi, John Smith!");
});
