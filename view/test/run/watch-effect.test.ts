import { $run, $watch } from "@tera/view";
import { expect, test } from "vitest";

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
