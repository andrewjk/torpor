import { $run, $watch } from "@tera/view";
import { beforeAll, expect, test } from "vitest";

test("setting the same value doesn't call effect again", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
	});
	let fullName = "";
	let counter = 0;
	const effect = $run(() => {
		fullName = `${person.firstName} ${person.lastName}`;
		counter++;
	});
	expect(fullName).toBe("Andrew Smith");
	expect(counter).toBe(1);
	person.firstName = "John";
	expect(fullName).toBe("John Smith");
	expect(counter).toBe(2);
	person.firstName = "John";
	person.firstName = "John";
	person.firstName = "John";
	person.firstName = "John";
	person.firstName = "John";
	expect(fullName).toBe("John Smith");
	expect(counter).toBe(2);
});
