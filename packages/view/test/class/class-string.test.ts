import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ClassString($props: { size: string; color: string }) {
	@render {
		<p class={"box " + $props.size + " " + $props.color}>
			Concatenated
		</p>
		<p class={["tag", $props.size, $props.color].join(" ")}>
			Joined
		</p>
	}
}
`;

test("class string concatenation -- mounted", async () => {
	let $state = $watch({ size: "large", color: "red" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("class string concatenation -- hydrated", async () => {
	let $state = $watch({ size: "large", color: "red" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const concatenated = queryByText(container, "Concatenated")!;
	const joined = queryByText(container, "Joined")!;

	expect(concatenated.className).toContain("box");
	expect(concatenated.className).toContain("large");
	expect(concatenated.className).toContain("red");

	expect(joined.className).toContain("tag");
	expect(joined.className).toContain("large");
	expect(joined.className).toContain("red");

	state.size = "small";

	expect(concatenated.className).toContain("small");
	expect(concatenated.className).not.toContain("large");
	expect(joined.className).toContain("small");
	expect(joined.className).not.toContain("large");
}

interface Props {
	size: string;
	color: string;
}
