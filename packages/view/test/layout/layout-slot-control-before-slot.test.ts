import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import fillLayoutSlot from "../../src/render/fillLayoutSlot";
import mount from "../../src/render/mount";
import type Region from "../../src/types/Region";
import type SlotRender from "../../src/types/SlotRender";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";

// The layout shape that crashed client-side navigation (Mallet): a persistent
// layout whose @if branch renders BEFORE its <slot />. The branch's region is
// the last region created when the slot fill runs, so `fillLayoutSlot` used to
// chain the page's slot region after it and rank it a level deeper. A reactive
// update in the layout that cleared the branch (e.g. hiding a banner when the
// url changes) then cascaded through `clearRegion` and released the page's
// slot region too: its effects were torn down (the page went inert) and the
// navigation reuse path found `startNode === null`.
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
	let $state = $watch({ count: 0 });
	@render {
		<h1>Home</h1>
		<button onclick={() => $state.count++}>Count {$state.count}</button>
	}
}
`;

test("clearing a layout @if before the slot keeps the slot page alive", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
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

	// The page is live before the layout's branch changes
	const button = container.querySelector("button")!;
	await userEvent.click(button);
	expect(queryByText(container, "Count 1")).not.toBeNull();

	// The layout hides its banner during navigation (a reactive update that
	// runs after $page.url changed) ...
	$props.showBar = false;
	expect(queryByText(container, "Approval needed")).toBeNull();

	// ... and the page's slot region must survive: the control branch above
	// the slot is not its ancestor, so clearing the branch must not release
	// the page (its effects would be torn down and the page would go inert)
	expect(queryByText(container, "Home")).not.toBeNull();
	expect(slotRegion!.startNode).not.toBeNull();
	expect(slotRegion!.startNode!.parentNode).not.toBeNull();
	await userEvent.click(button);
	expect(queryByText(container, "Count 2")).not.toBeNull();
});
