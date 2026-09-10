import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";

// The server rendered the catch branch; the client's try build must not
// corrupt the DOM when it throws — the hydration cursor rewind
// (saveHydration/restoreHydration) must let the catch branch hydrate the
// server's nodes exactly once.

// Single-element try branch — structurally matches the catch branch's one
// <p>, so the try build's hydration walk succeeds and the USER's error
// surfaces (not a walk TypeError)
const source = `
export default function TryHydrationPartial($props: { danger: boolean }) {
	function boom() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			<p>{boom()}</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("hydrated try that throws keeps the catch branch hydratable", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, { danger: true });

	// The catch branch must own the DOM exactly once — the server's node,
	// hydrated (not a duplicate fresh build)
	const errors = Array.from(container.querySelectorAll("p.error"));
	expect(errors).toHaveLength(1);
	expect(errors[0]).toHaveTextContent("Caught: boom");
	expect(container.querySelectorAll("p")).toHaveLength(1);
});

test("hydrated try that succeeds hydrates the try branch", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, { danger: false });

	expect(queryByText(container, "ok")).not.toBeNull();
	expect(container.querySelectorAll("p.error")).toHaveLength(0);
});

// Multi-element try branch — structurally DIFFERENT from the catch branch,
// so the failed try build's hydration walk runs past the server's nodes
// (driving the cursor to null) before throwing. The rewind must still
// restore the cursor: the catch branch hydrates the server's node, with no
// duplicates or orphaned partial content. The caught error in this case is
// the walk's (the user error never got to run) — best-effort, but the DOM
// must stay consistent.
const mismatchedSource = `
export default function TryHydrationMismatch($props: { danger: boolean }) {
	function boom() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	@render {
		@try {
			<p>safe</p>
			<p>{boom()}</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("hydrated try with mismatched branch structure keeps the DOM consistent", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, mismatchedSource, "client");
	const serverComponent = await importComponent(import.meta.filename, mismatchedSource, "server");
	await hydrateComponent(container, clientComponent, serverComponent, { danger: true });

	const errors = Array.from(container.querySelectorAll("p.error"));
	expect(errors).toHaveLength(1);
	expect(errors[0]).toHaveTextContent(/^Caught: /);
	expect(queryByText(container, "safe")).toBeNull();
	expect(container.querySelectorAll("p")).toHaveLength(1);
});
