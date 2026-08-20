import { describe, expect, test } from "vite-plus/test";
import route from "../src/nav/route";

describe("route", () => {
	test("returns a static path unchanged", () => {
		expect(route("/about")).toBe("/about");
		expect(route("/")).toBe("/");
	});

	test("fills in params", () => {
		expect(route("/posts/[id]", { id: "5" })).toBe("/posts/5");
	});

	test("fills in multiple params", () => {
		expect(route("/users/[userId]/posts/[postId]", { userId: "a", postId: "42" })).toBe(
			"/users/a/posts/42",
		);
	});

	test("encodes param values", () => {
		expect(route("/tags/[tag]", { tag: "hello world" })).toBe("/tags/hello%20world");
		expect(route("/tags/[tag]", { tag: "a/b" })).toBe("/tags/a%2Fb");
	});

	test("keeps slashes in splat params", () => {
		expect(route("/files/[...path]", { path: "a/b c" })).toBe("/files/a/b%20c");
	});

	test("throws when a param is missing", () => {
		const path: string = "/posts/[id]";
		expect(() => route(path)).toThrow("Missing param 'id'");
	});

	test("allows loose params for non-literal paths", () => {
		const path: string = "/posts/[id]";
		expect(route(path, { id: "5" })).toBe("/posts/5");
	});
});
