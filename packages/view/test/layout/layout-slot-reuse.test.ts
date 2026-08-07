import { queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { clearLayoutSlot, fillLayoutSlot, hydrate } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import type Component from "../src/types/Component";
import type Region from "../src/types/Region";
import type SlotRender from "../src/types/SlotRender";
import importComponent from "../importComponent";

// A layout with a <header> (its own child) followed by <slot/>. This mirrors
// examples/mini/src/Layout.torp, and is the shape that broke client-side
// navigation: the slot's container (<main>) always has the <header> as a
// child, so `mount` refuses to mount into it.
const layoutSource = `
export default function Layout() {
	@render {
		<main>
			<header>
				<h1>Mini Site</h1>
			</header>
			<slot />
		</main>
	}
}
`;

// A page with multiple top-level elements (the <button> needs a variable for
// its event handler) FOLLOWED by a trailing @if — the exact shape that
// produced a stale fragment endNode (the button) and left the <form>
// un-cleared on slot reuse.
const pageSource = `
export default function Page($props: any) {
	let $state = $watch({ count: 0 });
	@render {
		<p>The count is {\$props.count}.</p>
		<button onclick={() => \$state.count++}>Increment</button>
		<form>
			<input type="number" name="count" />
			<button type="submit">Set via server</button>
		</form>
		@if (\$props?.form?.message) {
			<p style="color: green">{\$props.form.message}</p>
		}
	}
}
`;

// The SSR HTML the server would produce for this layout + page. We build it
// by hand so we can hydrate against real DOM nodes (rather than an empty
// container, which would mask the stale-endNode bug).
const SSR_HTML =
	"<main>" +
	"<header><h1>Mini Site</h1></header>" +
	"<![>" + // slot hydration start
	"<p>The count is 0.</p> " +
	"<button>Increment</button> " +
	"<form><input type=\"number\" name=\"count\"><button type=\"submit\">Set via server</button></form> " +
	"<![><!]><!>" + // trailing @if (false branch): markers consumed, anchor remains
	"<!]>" + // slot hydration end
	"<!>" + // slot anchor
	"</main>";

test("clearing and refilling a layout slot keeps the layout's own children", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);

	const layoutComponent = (await importComponent(
		import.meta.filename,
		layoutSource,
		"client",
	)) as Component;
	const pageComponent = (await importComponent(
		// A throwaway second import: importComponent derives the component
		// name from the filename, so re-import with the page source right
		// after the layout. Both get built; only the last default export is
		// returned, which is what we want for `pageComponent`.
		import.meta.filename,
		pageSource,
		"client",
	)) as Component;

	// The slot region created by rendering the page into the layout's slot.
	let slotRegion: Region | null = null;
	const pageSlot: SlotRender = (parent, anchor) => {
		slotRegion = fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, {
			count: 0,
		});
	};

	// Hydrate against the SSR HTML so addFragment takes its hydration branch
	// (which uses the passed endNode, exposing the stale-endNode bug).
	container.innerHTML = SSR_HTML;
	hydrate(container, layoutComponent, undefined, { _: pageSlot });

	// Header from the layout is present, and the initial page content.
	expect(queryByText(container, "Mini Site")).not.toBeNull();
	expect(queryByText(container, "The count is 0.")).not.toBeNull();
	expect(slotRegion).not.toBeNull();

	// Simulate client-side navigation with a reusable layout: clear the slot,
	// then refill it with a new page render. The slot's container (<main>)
	// still holds the layout's <header>, so this must not go through `mount`.
	const parent = slotRegion!.startNode!.parentNode as HTMLElement;
	clearLayoutSlot(slotRegion!);
	const refillSlot: SlotRender = (p, anchor) => {
		slotRegion = fillLayoutSlot(pageComponent, (() => {}) as SlotRender, p, anchor, {
			count: 1,
		});
	};
	refillSlot(parent, null);

	// Layout's own children are untouched...
	expect(queryByText(container, "Mini Site")).not.toBeNull();
	// ...and the new page content is rendered into the slot.
	expect(queryByText(container, "The count is 1.")).not.toBeNull();
	expect(queryByText(container, "The count is 0.")).toBeNull();
	// The trailing form must not be duplicated — the whole slot fragment
	// (including nodes after the last declared element) must be cleared.
	expect(container.querySelectorAll("form").length).toBe(1);
	expect(queryAllByText(container, "Set via server").length).toBe(1);
});
