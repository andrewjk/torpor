import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import clearLayoutSlot from "../../src/render/clearLayoutSlot";
import fillLayoutSlot from "../../src/render/fillLayoutSlot";
import hydrate from "../../src/render/hydrate";
import type Region from "../../src/types/Region";
import type SlotRender from "../../src/types/SlotRender";
import importComponent from "../importComponent";

// Mirrors the docs site structure: a root layout (header + <slot/>), section
// layouts that render a shared section component (sidebar + <slot/>), and
// pages. This is the shape that broke client-side navigation between
// sections: reusing the ROOT layout while replacing the section layout must
// clear the root's slot (which holds the whole old section layout) and render
// the new section layout into it, then render the page into the new section
// layout's slot.

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

function sectionLayoutSource(label: string) {
	return `
function SectionLayout($props: any) {
	@render {
		<section>
			<aside>{$props.label} sidebar</aside>
			<div id="content">
				<slot />
			</div>
		</section>
	}
}

export default function Section${label}Layout($props: any) {
	@render {
		<SectionLayout label="${label}">
			<slot />
		</SectionLayout>
	}
}
`;
}

const docsLayoutSource = sectionLayoutSource("Docs");
const uiLayoutSource = sectionLayoutSource("UI");

const statePageSource = `
export default function StatePage($props: any) {
	@render {
		<h1>State</h1>
		<p>State page count {$props.count}</p>
	}
}
`;

const slotsPageSource = `
export default function SlotsPage($props: any) {
	@render {
		<h1>Slots</h1>
		<p>Slots page count {$props.count}</p>
	}
}
`;

const bindingsPageSource = `
export default function BindingsPage($props: any) {
	@render {
		<h1>Bindings</h1>
		<p>Bindings page count {$props.count}</p>
	}
}
`;

test("navigating between sections reuses the root layout and swaps the section layout", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);

	const client = {
		root: (await importComponent(import.meta.filename, rootLayoutSource, "client")) as any,
		docs: (await importComponent(import.meta.filename, docsLayoutSource, "client")) as any,
		ui: (await importComponent(import.meta.filename, uiLayoutSource, "client")) as any,
		statePage: (await importComponent(import.meta.filename, statePageSource, "client")) as any,
		slotsPage: (await importComponent(import.meta.filename, slotsPageSource, "client")) as any,
		bindingsPage: (await importComponent(
			import.meta.filename,
			bindingsPageSource,
			"client",
		)) as any,
	};

	const server = {
		root: (await importComponent(import.meta.filename, rootLayoutSource, "server")) as any,
		docs: (await importComponent(import.meta.filename, docsLayoutSource, "server")) as any,
		statePage: (await importComponent(import.meta.filename, statePageSource, "server")) as any,
	};

	// Build the SSR HTML the way serverEntry does: each layout composed into
	// the default slot of its parent. Slots and components are async now
	const statePageSlot = async (_, $context) =>
		(await server.statePage({ count: 0 }, $context)).body;
	const docsSlot = async (_, $context) =>
		(await server.docs({ count: 0 }, $context, { _: statePageSlot })).body;
	const { body } = await server.root({ count: 0 }, undefined, { _: docsSlot });
	container.innerHTML = body;

	// The client layout stack, mirroring navigate.ts: one entry per layout,
	// where entry i holds the region rendered inside layout i's slot
	const layoutStack: { slotRegion: Region | null }[] = [{ slotRegion: null }, { slotRegion: null }];

	// Slot functions mirroring navigate.ts: the last renders the page, earlier
	// ones render a layout and record the region in the parent's stack entry
	function makeClientComponent(page: any): SlotRender {
		return function clientComponent(parent, anchor) {
			layoutStack[layoutStack.length - 1].slotRegion = fillLayoutSlot(
				page,
				undefined,
				parent,
				anchor,
				{ count: 0 },
			);
		} as unknown as SlotRender;
	}

	const docsClientComponent = makeClientComponent(client.statePage);
	function docsLayoutComponent(parent: ParentNode, anchor: Node | null) {
		layoutStack[0].slotRegion = fillLayoutSlot(client.docs, docsClientComponent, parent, anchor, {
			count: 0,
		});
	}

	// Hydrate: root layout with the docs layout in its default slot
	hydrate(
		container,
		client.root,
		{ count: 0 },
		{
			_: docsLayoutComponent as unknown as SlotRender,
		},
	);

	// Everything rendered
	expect(queryByText(container, "Site header")).not.toBeNull();
	expect(queryByText(container, "Docs sidebar")).not.toBeNull();
	expect(queryByText(container, "State")).not.toBeNull();
	expect(layoutStack[0].slotRegion).not.toBeNull();
	expect(layoutStack[0].slotRegion!.startNode).not.toBeNull();
	// The region's start node must be attached — a detached node here makes
	// navigate.ts compute a null parent for the slot refill
	expect(layoutStack[0].slotRegion!.startNode!.parentNode).not.toBeNull();
	expect(layoutStack[1].slotRegion).not.toBeNull();

	// --- First click: navigate from /docs/state to /ui/overview ---
	// The root layout is reused; the docs layout is replaced with the ui one.
	// navigate.ts clears the REUSED layout's slot region and renders the new
	// section layout (with the page in its slot) into it.

	const rootSlotRegion = layoutStack[0].slotRegion!;
	const navParent = rootSlotRegion.startNode!.parentNode as HTMLElement;

	const uiClientComponent = makeClientComponent(client.slotsPage);
	function uiLayoutComponent(parent: ParentNode, anchor: Node | null) {
		layoutStack[0].slotRegion = fillLayoutSlot(client.ui, uiClientComponent, parent, anchor, {
			count: 0,
		});
	}

	clearLayoutSlot(rootSlotRegion);
	uiLayoutComponent(navParent, null);

	// The docs section is gone, the ui section (with its page) is in its place
	expect(queryByText(container, "Docs sidebar")).toBeNull();
	expect(queryByText(container, "UI sidebar")).not.toBeNull();
	expect(queryByText(container, "Slots")).not.toBeNull();
	expect(queryByText(container, "Site header")).not.toBeNull();

	// --- Second click: navigate within the ui section ---
	// The ui layout is reused; only the page is swapped

	const uiSlotRegion = layoutStack[1].slotRegion!;
	const pageParent = uiSlotRegion.startNode!.parentNode as HTMLElement;

	const bindingsClientComponent = makeClientComponent(client.bindingsPage);
	clearLayoutSlot(uiSlotRegion);
	bindingsClientComponent(pageParent, null);

	expect(queryByText(container, "Slots")).toBeNull();
	expect(queryByText(container, "Bindings")).not.toBeNull();
	expect(queryByText(container, "UI sidebar")).not.toBeNull();
	expect(queryByText(container, "Site header")).not.toBeNull();
});
