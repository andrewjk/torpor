import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("setting the same value doesn't call effect again", () => {
	const person = $watch({
		firstName: "Andrew",
		lastName: "Smith",
	});
	let fullName = "";
	let counter = 0;
	$run(() => {
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

test("setting the same NaN doesn't call effect again", () => {
	const $state = $watch({ a: NaN });
	let runs = 0;
	$run(() => {
		runs++;
		void $state.a;
	});
	expect(runs).toBe(1);

	// NaN !== NaN, but the value hasn't changed (Object.is)
	$state.a = NaN;
	expect(runs).toBe(1);

	// A real change still notifies
	$state.a = 1;
	expect(runs).toBe(2);

	// Including back to NaN
	$state.a = NaN;
	expect(runs).toBe(3);

	// And writing NaN again is still a no-op
	$state.a = NaN;
	expect(runs).toBe(3);
});
