import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import fillLayoutSlot from "../../src/render/fillLayoutSlot";
import mount from "../../src/render/mount";
import type Region from "../../src/types/Region";
import type SlotRender from "../../src/types/SlotRender";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";

// The layout shape that crashed client-side navigation (Mallet): a persistent
// layout whose @if branch renders BEFORE its <slot />. The branch's region is
// the last region created when the slot fill runs, so `fillLayoutSlot` chains
// the page's slot region after it and ranks it a level deeper. A reactive
// update in the layout that clears the branch (e.g. hiding a banner when the
// url changes) then cascades through `clearRegion` and releases the page's
// slot region too, leaving `startNode` null -- which the navigation reuse path
// dereferenced (`slotRegion.startNode!.parentNode`).
const layoutSource = `
export default function Layout($props: any) {
	@render {
		<header>Site header</header>
		@if ($props.showBar) {
			<div id="approval">Approval needed</div>
		}
		<main>
			<slot />
		</main>
	}
}
`;

const pageSource = `
export default function Page() {
	@render {
		<h1>Home</h1>
	}
}
`;

test("clearing a layout @if before the slot releases the slot region", async () => {
	const container = document.createElement("div");
	const layout = await importComponent(import.meta.filename, layoutSource, "client");
	const page = await importComponent(import.meta.filename, pageSource, "client");

	let slotRegion: Region | null = null;
	const pageSlot: SlotRender = (parent, anchor) => {
		slotRegion = fillLayoutSlot(page, (() => {}) as SlotRender, parent, anchor, {});
	};

	const $props = $watch({ showBar: true });
	mount(container, layout, $props, { _: pageSlot });

	expect(queryByText(container, "Approval needed")).not.toBeNull();
	expect(queryByText(container, "Home")).not.toBeNull();
	expect(slotRegion!.startNode).not.toBeNull();

	// The layout hides its banner during navigation (a reactive update that
	// runs after $page.url changed) ...
	$props.showBar = false;

	expect(queryByText(container, "Approval needed")).toBeNull();
	// ... and the page's slot region is released with the branch it was
	// chained under: navigate must not reuse a region whose startNode is null
	expect(slotRegion!.startNode).toBeNull();
});
