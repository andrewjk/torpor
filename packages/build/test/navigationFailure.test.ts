// @vitest-environment jsdom
import { expect, test, vi } from "vite-plus/test";
import handleNavigationFailure from "../src/nav/navigationFailure";

const href = "http://localhost/posts";

/** Shadows jsdom's `navigator.onLine`; returns a restore function. */
function stubOnline(online: boolean): () => void {
	Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
	return () => {
		delete (navigator as any).onLine;
	};
}

test("an online failure asks for the document fallback", () => {
	const restore = stubOnline(true);
	try {
		expect(handleNavigationFailure(href, { type: "failed", error: new Error("boom") })).toBe(
			"document",
		);
	} finally {
		restore();
	}
});

test("by-design server navigations always ask for the document", () => {
	// Offline makes no difference: a service-worker-cached shell is the only
	// way these could be handled client-side, and that is the app's call
	const restore = stubOnline(false);
	try {
		expect(handleNavigationFailure(href, { type: "server-only" })).toBe("document");
		expect(handleNavigationFailure(href, { type: "redirect" })).toBe("document");
	} finally {
		restore();
	}
});

test("an offline failure keeps the page and fires torpor:navigation-failed", () => {
	const restore = stubOnline(false);
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const listener = vi.fn();
	window.addEventListener("torpor:navigation-failed", listener);
	try {
		const error = new TypeError("network down");
		expect(handleNavigationFailure(href, { type: "failed", error })).toBe("kept");

		expect(listener).toHaveBeenCalledTimes(1);
		const event = listener.mock.calls[0][0] as CustomEvent;
		expect(event.cancelable).toBe(true);
		expect(event.detail.href).toBe(href);
		expect(event.detail.reason).toBe("offline");
		expect(event.detail.error).toBe(error);
		// The click was swallowed (the app didn't cancel), so warn
		expect(warn).toHaveBeenCalled();
	} finally {
		window.removeEventListener("torpor:navigation-failed", listener);
		warn.mockRestore();
		restore();
	}
});

test("an app can cancel the event to get the document load anyway", () => {
	const restore = stubOnline(false);
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const cancel = (event: Event) => event.preventDefault();
	window.addEventListener("torpor:navigation-failed", cancel);
	try {
		// e.g. its service worker caches the target shell
		expect(handleNavigationFailure(href, { type: "failed" })).toBe("document");
		expect(warn).not.toHaveBeenCalled();
	} finally {
		window.removeEventListener("torpor:navigation-failed", cancel);
		warn.mockRestore();
		restore();
	}
});
