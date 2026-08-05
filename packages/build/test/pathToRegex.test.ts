import { describe, expect, test } from "vite-plus/test";
import pathToRegex from "../src/utils/pathToRegex";

describe("pathToRegex", () => {
	test("matches a static path", () => {
		const re = pathToRegex("/posts");
		expect("/posts".match(re)).not.toBeNull();
	});

	test("does not match a different static path", () => {
		const re = pathToRegex("/posts");
		expect("/users".match(re)).toBeNull();
	});

	test("does not match a static path with extra segments", () => {
		const re = pathToRegex("/posts");
		expect("/posts/5".match(re)).toBeNull();
	});

	test("matches the root path", () => {
		const re = pathToRegex("/");
		expect("/".match(re)).not.toBeNull();
	});

	test("captures named params", () => {
		const re = pathToRegex("/posts/[id]");
		const match = "/posts/5".match(re);
		expect(match).not.toBeNull();
		expect(match?.groups?.id).toBe("5");
	});

	test("captures multiple named params", () => {
		const re = pathToRegex("/users/[userId]/posts/[postId]");
		const match = "/users/abc/posts/42".match(re);
		expect(match).not.toBeNull();
		expect(match?.groups?.userId).toBe("abc");
		expect(match?.groups?.postId).toBe("42");
	});

	test("does not match a param across segments", () => {
		const re = pathToRegex("/posts/[id]");
		expect("/posts/5/6".match(re)).toBeNull();
	});

	test("treats trailing slash as optional", () => {
		const re = pathToRegex("/posts");
		expect("/posts".match(re)).not.toBeNull();
		expect("/posts/".match(re)).not.toBeNull();
	});

	test("treats `*` as a wildcard", () => {
		const re = pathToRegex("*");
		expect("/anything/here".match(re)).not.toBeNull();
		expect("/assets/foo.css".match(re)).not.toBeNull();
	});

	test("wildcard matches the root", () => {
		const re = pathToRegex("*");
		expect("/".match(re)).not.toBeNull();
	});

	test("anchored at both ends", () => {
		const re = pathToRegex("/posts");
		expect("/foo/posts".match(re)).toBeNull();
	});

	test("matches `~server` sub-paths", () => {
		const re = pathToRegex("/posts/~server");
		expect("/posts/~server".match(re)).not.toBeNull();
		expect("/posts/5/~server".match(re)).toBeNull();
	});

	test("returns a global-shaped regex anchored at start", () => {
		const re = pathToRegex("/posts");
		// Anchored at start
		expect(re.source.startsWith("^")).toBe(true);
		// Anchored at end (after optional trailing slashes)
		expect(re.source.endsWith("$")).toBe(true);
	});
});
