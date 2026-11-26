import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import type Region from "../../src/types/Region";
import type SlotRender from "../../src/types/SlotRender";
import importComponent from "../importComponent";
import Component from "../../src/types/Component";
import fillLayoutSlot from "../../src/render/fillLayoutSlot";
import clearLayoutSlot from "../../src/render/clearLayoutSlot";
import mount from "../../src/render/mount";

// A layout whose header follows the page's data: it branches on
// `$props.data.bare` (e.g. a page asking for the header to be left out) and
// shows `$props.data.title`. This is what the client router relies on when it
// keeps a layout on screen across navigations: it points the layout's
// `$props.data` at each new page's merged load data, and the layout's effects
// -- which read `$props.data` reactively -- re-render it.
const layoutSource = `
export default function Layout($props: any) {
	@render {
		<main>
			@if ($props.data.bare) {
				<span>no header</span>
			} else {
				<header>{$props.data.title}</header>
			}
			<slot />
		</main>
	}
}
`;

const pageSource = `
export default function Page($props: any) {
	@render {
		<p>{$props.message}</p>
	}
}
`;

test("a layout re-renders when its props' data is pointed at a new page", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);

	const layoutComponent = (await importComponent(
		import.meta.filename,
		layoutSource,
		"client",
	)) as Component;
	const pageComponent = (await importComponent(
		import.meta.filename,
		pageSource,
		"client",
	)) as Component;

	// The reactive props a navigation passes to the layout (nav/navigate.ts
	// wraps them in `$watch`)
	const props = $watch<Record<PropertyKey, any>>({
		data: { bare: false, title: "Home" },
		form: undefined,
	});

	// The slot region created by rendering the page into the layout's slot.
	let slotRegion: Region | null = null;
	const pageSlot: SlotRender = (parent, anchor) => {
		slotRegion = fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, {
			message: "home page",
		});
	};

	mount(container, layoutComponent, props, { _: pageSlot });

	expect(queryByText(container, "Home")).not.toBeNull();
	expect(queryByText(container, "home page")).not.toBeNull();

	// Simulate a client navigation that reuses this layout: the router points
	// the layout's props at the new page's data, then clears and refills the
	// slot with the new page
	props.data = { bare: true, title: "Other" };

	const parent = slotRegion!.startNode!.parentNode as HTMLElement;
	clearLayoutSlot(slotRegion!);
	fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, null, { message: "other page" });

	// The header followed the new page's data (the @if branch switched)...
	expect(queryByText(container, "no header")).not.toBeNull();
	expect(queryByText(container, "Home")).toBeNull();
	// ...and the new page content replaced the old in the slot
	expect(queryByText(container, "other page")).not.toBeNull();
	expect(queryByText(container, "home page")).toBeNull();
});
