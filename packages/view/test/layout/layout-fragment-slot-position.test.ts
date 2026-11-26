import { queryAllByText } from "@testing-library/dom";
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

// A layout whose slot sits between siblings, with no element of its own
// around it. This is the shape that broke client-side navigation: the router
// clears the slot's region and renders the next page into the slot's parent,
// which (without the slot's anchor) appends the page after the siblings.
const layoutSource = `
export default function Layout($props: any) {
	@render {
		<p>before</p>
		<slot />
		<p>after</p>
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

/** The page texts of the container, in DOM order. */
function pageTexts(container: ParentNode): string[] {
	return [...container.querySelectorAll("p")].map((p) => p.textContent!.trim());
}

test("a refilled slot renders the next page between the layout's siblings", async () => {
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

	// The slot render the router passes to the layout (nav/navigate.ts's slot
	// functions): it renders the page into whatever parent/anchor the layout's
	// `<slot />` invocation passes, and remembers the region -- and the
	// anchor, so a refill can insert at the slot's position
	let slotRegion: Region | null = null;
	let slotAnchor: Node | null = null;
	const pageSlot: SlotRender = (parent, anchor) => {
		slotAnchor = anchor;
		slotRegion = fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, {
			message: "page one",
		});
	};

	mount(container, layoutComponent, undefined, { _: pageSlot });

	expect(pageTexts(container)).toEqual(["before", "page one", "after"]);

	// The router's refill (nav/navigate.ts): render into the slot anchor's
	// parent, before the anchor -- the anchor is the comment the compiler
	// plants at the slot's place, and it stays in the DOM after the old page
	// is cleared
	const anchor = slotAnchor!;
	expect(anchor.parentNode).not.toBeNull();
	const parent = anchor.parentNode!;
	clearLayoutSlot(slotRegion!);
	fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, { message: "page two" });

	// The new page landed where the slot is, not after the siblings
	expect(pageTexts(container)).toEqual(["before", "page two", "after"]);
	expect(queryAllByText(container, "page one")).toHaveLength(0);
});

test("a refilled slot between @if branches keeps the page between them", async () => {
	// The shape from practice: an optional header and footer around the slot
	// (`@if (!$page.meta?.bare)`), which the layout's data/meta can flip while
	// the layout stays mounted
	const layoutSource = `
export default function Layout($props: any) {
	@render {
		@if (!$props.data.bare) {
			<p>header</p>
		}
		<slot />
		@if (!$props.data.bare) {
			<p>footer</p>
		}
	}
}
`;
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

	// Reactive layout props, like the router passes (nav/navigate.ts)
	const props = $watch<Record<PropertyKey, any>>({ data: { bare: false }, form: undefined });

	let slotRegion: Region | null = null;
	let slotAnchor: Node | null = null;
	const pageSlot: SlotRender = (parent, anchor) => {
		slotAnchor = anchor;
		slotRegion = fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, {
			message: "page one",
		});
	};

	mount(container, layoutComponent, props, { _: pageSlot });

	expect(pageTexts(container)).toEqual(["header", "page one", "footer"]);

	// A navigation to a bare page: the router points the layout's props at the
	// new page's data (flipping the branches off), then refills the slot
	props.data = { bare: true, form: undefined };
	const anchor = slotAnchor!;
	const parent = anchor.parentNode!;
	clearLayoutSlot(slotRegion!);
	fillLayoutSlot(pageComponent, (() => {}) as SlotRender, parent, anchor, { message: "page two" });

	// The page is still between the (now hidden) header and footer positions,
	// not after the footer
	expect(pageTexts(container)).toEqual(["page two"]);
});
