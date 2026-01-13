import { expect, test } from "vitest";
import check from "../src/check";
import checkFile from "../src/checkFile";

test("check folder", () => {
	const errors = check("test").filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(2);
});

test("check file", () => {
	const errors = checkFile("test/src/BadScript.torp").filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(1);
	expect(errors[0].message).toBe("Cannot find name 'y'.");
});

test("check ts file", () => {
	const errors = checkFile("test/src/bad.ts").filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(1);
	expect(errors[0].message).toBe("Type 'string' is not assignable to type 'number'.");
});
