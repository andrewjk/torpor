import { expect, test, vi } from "vite-plus/test";
import devContext from "../../src/dev/devContext";
import checkListKeys from "../../src/render/checkListKeys";
import type Region from "../../src/types/Region";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A keyed `@for` matched by `runListItems` uses first-match-wins, so duplicate
// `@key` values make updates and removals hit the wrong rows. In dev mode
// `runList` warns once per duplicate key so the data bug surfaces immediately.
const source = `
export default function ForDuplicateKeys($props: { items: Array<{ id: number, label: string }> }) {
	@render {
		<ul>
			@for (let row of $props.items) {
				@key = row.id
				<li>{row.label}</li>
			}
		</ul>
	}
}
`;

async function mountWithDev(
	component: any,
	$state: any,
): Promise<{ container: HTMLElement; warn: ReturnType<typeof vi.spyOn> }> {
	const container = document.createElement("div");
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const prev = devContext.enabled;
	devContext.enabled = true;
	try {
		mountComponent(container, component, $state);
	} finally {
		devContext.enabled = prev;
	}
	return { container, warn };
}

test("dev mode warns about duplicate @key values", async () => {
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 1, label: "b" },
		],
	});
	const component = await importComponent(import.meta.filename, source, "client");
	const { warn } = await mountWithDev(component, $state);

	expect(warn).toHaveBeenCalledTimes(1);
	expect(warn.mock.calls[0]![0]).toContain("Duplicate @key");
	expect(warn.mock.calls[0]![0]).toContain("1");
	warn.mockRestore();
});

test("no warning when all keys are unique", async () => {
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
	});
	const component = await importComponent(import.meta.filename, source, "client");
	const { warn } = await mountWithDev(component, $state);

	expect(warn).not.toHaveBeenCalled();
	warn.mockRestore();
});

test("no duplicate-key warning when dev mode is off", async () => {
	const $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 1, label: "b" },
		],
	});
	const component = await importComponent(import.meta.filename, source, "client");

	const container = document.createElement("div");
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	mountComponent(container, component, $state);

	expect(warn).not.toHaveBeenCalled();
	warn.mockRestore();
});

// --- checkListKeys unit tests ---

function fakeRegion(): Region {
	return {
		startNode: null,
		endNode: null,
		previousRegion: null,
		nextRegion: null,
		depth: 0,
		animations: null,
		effects: [],
	};
}

test("checkListKeys ignores unkeyed rows", () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	checkListKeys(fakeRegion(), [
		{ key: undefined, data: 1 },
		{ key: undefined, data: 2 },
	]);
	checkListKeys(fakeRegion(), [
		{ key: null, data: 1 },
		{ key: null, data: 2 },
	]);
	expect(warn).not.toHaveBeenCalled();
	warn.mockRestore();
});

test("checkListKeys warns once per duplicate key per list", () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const region = fakeRegion();
	const specs = [
		{ key: "a", data: 1 },
		{ key: "a", data: 2 },
		{ key: "a", data: 3 },
		{ key: "b", data: 4 },
		{ key: "b", data: 5 },
	];

	// Re-running the same list should not warn again for the same keys
	checkListKeys(region, specs);
	checkListKeys(region, specs);
	expect(warn).toHaveBeenCalledTimes(2);

	// A different list with the same duplicate key still warns
	checkListKeys(fakeRegion(), specs);
	expect(warn).toHaveBeenCalledTimes(4);
	warn.mockRestore();
});
