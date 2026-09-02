import { assert, expect, test } from "vite-plus/test";
import PathTrie from "../src/utils/pathTrie";

test("matches a static path", () => {
	const t = new PathTrie<string>();
	t.insert("/posts", "posts");
	expect(t.match("/posts")?.value).toBe("posts");
});

test("does not match a different static path or extra segments", () => {
	const t = new PathTrie<string>();
	t.insert("/posts", "posts");
	expect(t.match("/users")).toBeUndefined();
	expect(t.match("/posts/5")).toBeUndefined();
});

test("matches the root path", () => {
	const t = new PathTrie<string>();
	t.insert("/", "root");
	expect(t.match("/")?.value).toBe("root");
	expect(t.match("/too/deep")).toBeUndefined();
});

test("captures named params", () => {
	const t = new PathTrie<string>();
	t.insert("/posts/[id]", "post");
	const match = t.match("/posts/5");
	assert(match);
	expect(match.value).toBe("post");
	expect(match.params?.id).toBe("5");
});

test("captures multiple named params", () => {
	const t = new PathTrie<string>();
	t.insert("/users/[userId]/posts/[postId]", "post");
	const match = t.match("/users/abc/posts/42");
	assert(match);
	expect(match.params?.userId).toBe("abc");
	expect(match.params?.postId).toBe("42");
});

test("does not match a param across segments", () => {
	const t = new PathTrie<string>();
	t.insert("/posts/[id]", "post");
	expect(t.match("/posts/5/6")).toBeUndefined();
});

test("static segments win over params", () => {
	const t = new PathTrie<string>();
	t.insert("/posts/[id]", "param");
	t.insert("/posts/drafts", "drafts");
	expect(t.match("/posts/drafts")?.value).toBe("drafts");
	expect(t.match("/posts/5")?.value).toBe("param");
});

test("captures a splat param across segments", () => {
	const t = new PathTrie<string>();
	t.insert("/files/[...path]", "file");
	const match = t.match("/files/a/b/c");
	assert(match);
	expect(match.params?.path).toBe("a/b/c");
});

test("captures a splat param with a single segment", () => {
	const t = new PathTrie<string>();
	t.insert("/files/[...path]", "file");
	expect(t.match("/files/readme.md")?.params?.path).toBe("readme.md");
});

test("does not match a splat route without a trailing segment", () => {
	const t = new PathTrie<string>();
	t.insert("/files/[...path]", "file");
	expect(t.match("/files")).toBeUndefined();
	expect(t.match("/files/")).toBeUndefined();
});

test("treats trailing slash as optional", () => {
	const t = new PathTrie<string>();
	t.insert("/posts", "posts");
	expect(t.match("/posts/")?.value).toBe("posts");
	expect(t.match("/posts///")?.value).toBe("posts");
});

test("treats `*` as a wildcard", () => {
	const t = new PathTrie<string>();
	t.insert("*", "any");
	expect(t.match("/anything/here")?.value).toBe("any");
	expect(t.match("/assets/foo.css")?.value).toBe("any");
});

test("wildcard matches the root", () => {
	const t = new PathTrie<string>();
	t.insert("*", "any");
	expect(t.match("/")?.value).toBe("any");
});

test("wildcard after a prefix", () => {
	const t = new PathTrie<string>();
	t.insert("/assets/*", "asset");
	expect(t.match("/assets/foo.css")?.value).toBe("asset");
	expect(t.match("/assets/a/b/c")?.value).toBe("asset");
	expect(t.match("/assets/")?.value).toBe("asset");
	expect(t.match("/assets")).toBeUndefined();
	expect(t.match("/images/foo.css")).toBeUndefined();
});

test("params is undefined when nothing is captured", () => {
	const t = new PathTrie<string>();
	t.insert("/posts", "posts");
	expect(t.match("/posts")?.params).toBeUndefined();
});

test("anchored at both ends", () => {
	const t = new PathTrie<string>();
	t.insert("/posts", "posts");
	expect(t.match("/foo/posts")).toBeUndefined();
});

test("matches `~server` sub-paths", () => {
	const t = new PathTrie<string>();
	t.insert("/posts/~server", "server");
	expect(t.match("/posts/~server")?.value).toBe("server");
	expect(t.match("/posts/5/~server")).toBeUndefined();
});

test("a segment with an embedded glob matches one segment", () => {
	const t = new PathTrie<string>();
	t.insert("/files/*.css", "css");
	expect(t.match("/files/style.css")?.value).toBe("css");
	expect(t.match("/files/deep/style.css")).toBeUndefined();
	expect(t.match("/files/style.js")).toBeUndefined();
});

test("first registration of an exact pattern wins", () => {
	const t = new PathTrie<string>();
	t.insert("/x", "first");
	t.insert("/x", "second");
	expect(t.match("/x")?.value).toBe("first");
});

test("backtracks from a static miss to a param match", () => {
	const t = new PathTrie<string>();
	t.insert("/posts/new/[id]", "dead-end");
	t.insert("/[section]/[id]", "param");
	const match = t.match("/anything/5");
	assert(match);
	expect(match.value).toBe("param");
	expect(match.params?.section).toBe("anything");
	expect(match.params?.id).toBe("5");
});
