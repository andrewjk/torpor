import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	hidden: boolean;
	color: string | undefined;
}

// A dynamic style is the whole `style` attribute (the fragment omits it), so
// clearing a property -- not just changing it -- must replace the previous
// declarations rather than append to them
const source = `
export default function StyleClear($props: { hidden: boolean; color: string | undefined }) {
	@render {
		<div class="object" style={{ display: $props.hidden ? "none" : undefined }}>Object</div>
		<div class="string" style="color: {$props.color}">String</div>
	}
}
`;

test("style clear -- mounted", async () => {
	const $state = $watch({ hidden: true, color: "red" as string | undefined });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("style clear -- hydrated", async () => {
	const $state = $watch({ hidden: true, color: "red" as string | undefined });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const object = queryByText(container, "Object") as HTMLElement;
	expect(object.style.display).toBe("none");
	state.hidden = false;
	expect(object.style.display).toBe("");

	const string = queryByText(container, "String") as HTMLElement;
	expect(string.style.color).toBe("red");
	state.color = undefined;
	expect(string.style.color).toBe("");
}
