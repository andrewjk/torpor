import path from "node:path";
import { expect, test } from "vite-plus/test";
import check from "../src/check";
import checkFile from "../src/checkFile";

const testFolder = path.join(__dirname, "..", "test");
const srcFolder = path.join(testFolder, "src");

test("check folder", () => {
	const errors = check(testFolder).filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(2);
});

test("check file", () => {
	const errors = checkFile(path.join(srcFolder, "BadScript.torp")).filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(1);
	expect(errors[0].message).toBe("Cannot find name 'y'.");
});

test("check ts file", () => {
	const errors = checkFile(path.join(srcFolder, "bad.ts")).filter(
		(e) =>
			e.message !== "Cannot find module '@torpor/view' or its corresponding type declarations.",
	);
	expect(errors.length).toBe(1);
	expect(errors[0].message).toBe("Type 'string' is not assignable to type 'number'.");
});
