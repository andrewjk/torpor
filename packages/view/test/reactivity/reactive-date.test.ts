import { expect, test } from "vitest";
import ReactiveDate from "../../src/wrappers/ReactiveDate";

test("ReactiveDate creates a valid Date", () => {
	let date = new ReactiveDate(2024, 0, 15);
	expect(date.getFullYear()).toBe(2024);
	expect(date.getMonth()).toBe(0);
	expect(date.getDate()).toBe(15);
});

test("ReactiveDate getFullYear returns correct value", () => {
	let date = new ReactiveDate("2024-06-15T00:00:00Z");
	expect(date.getFullYear()).toBe(2024);
});

test("ReactiveDate setFullYear updates value", () => {
	let date = new ReactiveDate(2020, 5, 1);
	expect(date.getFullYear()).toBe(2020);

	date.setFullYear(2025);
	expect(date.getFullYear()).toBe(2025);
});

test("ReactiveDate valueOf returns timestamp", () => {
	let date = new ReactiveDate(2024, 0, 1);
	let timestamp = date.valueOf();
	expect(typeof timestamp).toBe("number");
	expect(timestamp).toBe(new Date(2024, 0, 1).getTime());
});

test("ReactiveDate toISOString returns string", () => {
	let date = new ReactiveDate(2024, 0, 1);
	expect(typeof date.toISOString()).toBe("string");
});

test("ReactiveDate toString returns string", () => {
	let date = new ReactiveDate(2024, 0, 1);
	expect(typeof date.toString()).toBe("string");
});

test("ReactiveDate getTime returns number", () => {
	let date = new ReactiveDate(2024, 0, 1);
	expect(typeof date.getTime()).toBe("number");
});

test("ReactiveDate setTime updates value", () => {
	let date = new ReactiveDate(2024, 0, 1);
	let original = date.getTime();

	date.setTime(original + 86400000); // +1 day
	expect(date.getTime()).toBe(original + 86400000);
});

test("ReactiveDate getHours/setHours", () => {
	let date = new ReactiveDate(2024, 0, 1, 10, 30);
	expect(date.getHours()).toBe(10);

	date.setHours(15);
	expect(date.getHours()).toBe(15);
});

test("ReactiveDate getMinutes/setMinutes", () => {
	let date = new ReactiveDate(2024, 0, 1, 10, 30);
	expect(date.getMinutes()).toBe(30);

	date.setMinutes(45);
	expect(date.getMinutes()).toBe(45);
});

test("ReactiveDate with no args uses current time", () => {
	let date = new ReactiveDate();
	let now = new Date();
	expect(Math.abs(date.getTime() - now.getTime())).toBeLessThan(1000);
});

test("ReactiveDate extends Date", () => {
	let date = new ReactiveDate();
	expect(date).toBeInstanceOf(Date);
	expect(date).toBeInstanceOf(ReactiveDate);
});

test("ReactiveDate getDay returns correct day", () => {
	let date = new ReactiveDate(2024, 0, 1); // Jan 1, 2024 is Monday
	expect(date.getDay()).toBe(1);
});
