import { $run, $watch } from "@tera/view";
import { expect, test } from "vitest";

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
	const effect = $run(() => {
		// @ts-ignore TODO
		greeting = `Hi, ${person.fullName}!`;
	});
	expect(greeting).toBe("Hi, Andrew Smith!");
	person.firstName = "John";
	expect(greeting).toBe("Hi, John Smith!");
});
