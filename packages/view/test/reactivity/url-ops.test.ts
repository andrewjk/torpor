import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watched URL properties and methods work", () => {
	const url = $watch(new URL("https://example.com/a/b?x=1#top"));

	expect(url).toBeInstanceOf(URL);
	expect(url.href).toBe("https://example.com/a/b?x=1#top");
	expect(url.origin).toBe("https://example.com");
	expect(url.hostname).toBe("example.com");
	expect(url.pathname).toBe("/a/b");
	expect(url.search).toBe("?x=1");
	expect(url.hash).toBe("#top");
	expect(url.toString()).toBe("https://example.com/a/b?x=1#top");
	expect(url.toJSON()).toBe("https://example.com/a/b?x=1#top");
	expect((url as any)[proxyDataSymbol]).toBeDefined();
});

test("URL property writes re-run effects", () => {
	const url = $watch(new URL("https://example.com/a"));
	let runs = 0;
	let path = "";

	$run(() => {
		runs += 1;
		path = url.pathname;
	});

	expect(runs).toBe(1);

	url.pathname = "/b";
	expect(runs).toBe(2);
	expect(path).toBe("/b");

	// A no-op write doesn't re-run
	url.pathname = "/b";
	expect(runs).toBe(2);
});

test("URL runs of toString/toJSON track changes", () => {
	const url = $watch(new URL("https://example.com/a"));
	let runs = 0;
	let text = "";

	$run(() => {
		runs += 1;
		text = String(url);
	});

	expect(runs).toBe(1);
	url.pathname = "/b";
	expect(runs).toBe(2);
	expect(text).toBe("https://example.com/b");
});

test("watched URLSearchParams methods work", () => {
	const params = $watch(new URLSearchParams("a=1&a=2&b=3"));

	expect(params).toBeInstanceOf(URLSearchParams);
	expect(params.size).toBe(3);
	expect(params.get("a")).toBe("1");
	expect(params.getAll("a")).toEqual(["1", "2"]);
	expect(params.has("b")).toBe(true);
	expect(params.toString()).toBe("a=1&a=2&b=3");
	expect([...params]).toEqual([
		["a", "1"],
		["a", "2"],
		["b", "3"],
	]);
	expect([...params.keys()]).toEqual(["a", "a", "b"]);
	expect((params as any)[proxyDataSymbol]).toBeDefined();
});

test("URLSearchParams mutations re-run effects", () => {
	const params = $watch(new URLSearchParams("a=1"));
	let runs = 0;
	let value = "";

	$run(() => {
		runs += 1;
		value = params.get("a") ?? "";
	});

	expect(runs).toBe(1);

	params.set("a", "2");
	expect(runs).toBe(2);
	expect(value).toBe("2");

	// A no-op write doesn't re-run
	params.set("a", "2");
	expect(runs).toBe(2);
});

test("url.searchParams is a stable, reactive view", () => {
	const url = $watch(new URL("https://example.com/?q=1"));
	const params = url.searchParams;

	expect(params).toBe(url.searchParams);
	expect(params).toBeInstanceOf(URLSearchParams);

	let runs = 0;
	let search = "";

	$run(() => {
		runs += 1;
		search = url.search;
	});

	expect(runs).toBe(1);

	// Mutating through searchParams re-runs URL readers
	params.set("q", "2");
	expect(runs).toBe(2);
	expect(search).toBe("?q=2");
});

test("URL writes re-run searchParams readers", () => {
	const url = $watch(new URL("https://example.com/?q=1"));
	let runs = 0;
	let value = "";

	$run(() => {
		runs += 1;
		value = url.searchParams.get("q") ?? "";
	});

	expect(runs).toBe(1);

	url.search = "?q=2";
	expect(runs).toBe(2);
	expect(value).toBe("2");
});

test("replacing a URL in watched state is reactive", () => {
	const $state = $watch({ url: new URL("https://example.com/a") });
	let runs = 0;
	let href = "";

	$run(() => {
		runs += 1;
		href = $state.url.href;
	});

	expect(runs).toBe(1);

	$state.url = new URL("https://example.com/b");
	expect(runs).toBe(2);
	expect(href).toBe("https://example.com/b");
});
