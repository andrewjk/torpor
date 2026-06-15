import { expect, test } from "vitest";
import $unwrap from "../../src/watch/$unwrap";
import $watch from "../../src/watch/$watch";

test("$unwrap returns the raw target from a proxy", () => {
	let raw = { a: 1, b: 2 };
	let proxy = $watch(raw);
	let unwrapped = $unwrap(proxy);

	expect(unwrapped).not.toBe(proxy);
	expect(unwrapped).toBe(raw);
});

test("$unwrap returns the same object for non-proxy", () => {
	let raw = { a: 1 };
	let unwrapped = $unwrap(raw);

	expect(unwrapped).toBe(raw);
});

test("$unwrap handles null and undefined", () => {
	expect($unwrap(null as any)).toBe(null);
	expect($unwrap(undefined as any)).toBe(undefined);
});

test("$unwrap returns nested objects as raw targets", () => {
	let raw = { nested: { x: 1 } };
	let proxy = $watch(raw);
	let unwrapped = $unwrap(proxy);

	expect(unwrapped.nested).toEqual({ x: 1 });
});

test("$unwrap allows JSON.stringify on reactive objects", () => {
	let proxy = $watch({ name: "test", value: 42 });
	let json = JSON.stringify($unwrap(proxy));

	expect(JSON.parse(json)).toEqual({ name: "test", value: 42 });
});

test("$unwrap returns array target from proxy", () => {
	let raw = [1, 2, 3];
	let proxy = $watch(raw);
	let unwrapped = $unwrap(proxy);

	expect(Array.isArray(unwrapped)).toBe(true);
	expect(unwrapped.length).toBe(3);
	expect(unwrapped[0]).toBe(1);
	expect(unwrapped[1]).toBe(2);
	expect(unwrapped[2]).toBe(3);
});
