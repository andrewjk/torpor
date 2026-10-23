import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import clearLayoutSlot from "../../src/render/clearLayoutSlot";
import fillLayoutSlot from "../../src/render/fillLayoutSlot";
import hydrate from "../../src/render/hydrate";
import type Region from "../../src/types/Region";
import type SlotRender from "../../src/types/SlotRender";
import importComponent from "../importComponent";

// A root layout (header + <slot/>) and a section layout that renders its own
// content *after* its slot — the shape that broke client-side navigation: the
// router refills slots imperatively, outside any render/effect context, so the
// refilled slot's depth was derived from the ambient active region (usually
// the root) instead of the layout region it is actually chained after. With
// the slot mis-ranked at depth 0, the next `clearLayoutSlot` walked past the
// page content and released the section layout's own regions — its components
// stopped re-rendering even though their DOM was still in place.
const rootLayoutSource = `
export default function Layout($props: any) {
	@render {
		<div id="layout">
			<header>Site header</header>
			<div id="page">
				<slot />
			</div>
		</div>
	}
}
`;

const sectionLayoutSource = `
export default function SectionLayout($props: any) {
	let $state = $watch({ count: 0 });
	@render {
		<section>
			<aside>Docs sidebar</aside>
			<div id="content">
				<slot />
			</div>
			@if (true) {
				<footer id="section-footer">
					<span>Docs footer {$state.count}</span>
					<button onclick={() => $state.count++}>Section bump</button>
				</footer>
			}
		</section>
	}
}
`;

const pageSource = (label: string) => `
export default function Page($props: any) {
	@render {
		<h1>${label}</h1>
	}
}
`;

test("refilling a layout slot keeps the layout's own regions alive", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);

	const client = {
		root: await importComponent(import.meta.filename, rootLayoutSource, "client"),
		section: await importComponent(import.meta.filename, sectionLayoutSource, "client"),
		page1: await importComponent(import.meta.filename, pageSource("Page one"), "client"),
		page2: await importComponent(import.meta.filename, pageSource("Page two"), "client"),
	};

	// Mirrors navigate.ts: the layout stack holds one region per layout slot
	const layoutStack: { slotRegion: Region | null }[] = [{ slotRegion: null }, { slotRegion: null }];

	const noopSlot = (() => {}) as SlotRender;

	function pageSlotFiller(page: any, stackIndex: number): SlotRender {
		return function clientComponent(parent: ParentNode, anchor: Node | null) {
			layoutStack[stackIndex].slotRegion = fillLayoutSlot(page, noopSlot, parent, anchor, {});
		} as unknown as SlotRender;
	}

	const sectionLayoutComponent = ((parent: ParentNode, anchor: Node | null) => {
		layoutStack[0].slotRegion = fillLayoutSlot(
			client.section,
			pageSlotFiller(client.page1, 1),
			parent,
			anchor,
			{},
		);
	}) as unknown as SlotRender;

	hydrate(container, client.root, {}, { _: sectionLayoutComponent });

	expect(queryByText(container, "Docs sidebar")).not.toBeNull();
	expect(queryByText(container, "Page one")).not.toBeNull();
	expect(queryByText(container, "Docs footer 0")).not.toBeNull();

	// The section layout's own content is alive before any refill
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);
	expect(queryByText(container, "Docs footer 1")).not.toBeNull();

	// Refill the section layout's slot the way the router does — imperatively,
	// outside any render/effect context. The slot must be ranked as a child of
	// the section layout's region (the region it is chained after), not as a
	// child of whatever region the last effect happened to leave active.
	const pageRegion = layoutStack[1].slotRegion!;
	const pageParent = pageRegion.startNode!.parentNode as HTMLElement;
	expect(pageRegion.depth).toBe(1);

	clearLayoutSlot(pageRegion);
	layoutStack[1].slotRegion = fillLayoutSlot(client.page2, noopSlot, pageParent, null, {});
	expect(layoutStack[1].slotRegion!.depth).toBe(1);

	expect(queryByText(container, "Page one")).toBeNull();
	expect(queryByText(container, "Page two")).not.toBeNull();

	// A second refill clears the mis-ranked slot; this must not walk past the
	// page content and release the section layout's own regions
	clearLayoutSlot(layoutStack[1].slotRegion!);
	layoutStack[1].slotRegion = fillLayoutSlot(client.page1, noopSlot, pageParent, null, {});
	expect(queryByText(container, "Page two")).toBeNull();
	expect(queryByText(container, "Page one")).not.toBeNull();

	// The section layout's footer must still be live: the state write below
	// re-renders it, rather than landing on a released region
	await userEvent.click(button);
	expect(queryByText(container, "Docs footer 2")).not.toBeNull();
});
