// @vitest-environment jsdom
import { expect, test } from "vite-plus/test";
import isSamePageNavigation from "../src/nav/isSamePageNavigation";
import { setBasePath } from "../src/site/basePath";
import $page from "../src/state/$page";

/** Moves the document location the way a browser's history does. */
function goto(url: string) {
	window.history.replaceState({}, "", url);
}

test("a hash-only change stays on the page being shown", () => {
	// A `#hash` link click pushes a history entry and fires popstate, but
	// the browser has scrolled to the target itself
	$page.url = new URL("http://localhost/docs/intro");
	goto("/docs/intro#setup");

	expect(isSamePageNavigation(document.location)).toBe(true);
});

test("a hash going away entirely stays on the page being shown", () => {
	// Back/forward between hash entries and the plain page url
	$page.url = new URL("http://localhost/docs/intro");
	goto("/docs/intro");
	expect(isSamePageNavigation(document.location)).toBe(true);

	// The page may itself have been loaded (or navigated to) with a hash
	$page.url = new URL("http://localhost/docs/intro#setup");
	expect(isSamePageNavigation(document.location)).toBe(true);
});

test("a query change is a different navigation", () => {
	$page.url = new URL("http://localhost/docs/intro");
	goto("/docs/intro?page=2");

	expect(isSamePageNavigation(document.location)).toBe(false);
});

test("a path change is a different navigation", () => {
	$page.url = new URL("http://localhost/docs/intro");
	goto("/docs/other#setup");

	expect(isSamePageNavigation(document.location)).toBe(false);
});

test("a url outside the site's base path is never the same page", () => {
	setBasePath("/app");
	try {
		// $page.url is base-free; the browser's location carries the base
		$page.url = new URL("http://localhost/docs/intro");
		goto("/app/docs/intro#setup");
		expect(isSamePageNavigation(document.location)).toBe(true);

		goto("/other/docs/intro");
		expect(isSamePageNavigation(document.location)).toBe(false);
	} finally {
		setBasePath("");
	}
});
