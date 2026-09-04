import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function HtmlTextarea() {
	let $state = $watch({
		text: "first",
		get output() {
			return "<h1>" + $state.text + "</h1>\\n<p>End of " + $state.text + "</p>";
		},
	});

	@render {
		<div class="card">
			<textarea &value={$state.text}></textarea>
			<div class="output">
				@html($state.output)
			</div>
		</div>
	}
}
`;

test("html textarea -- mounted", async () => {
	let $state = $watch({
		text: "first",
		get output() {
			return "<h1>" + $state.text + "</h1>\n<p>End of " + $state.text + "</p>";
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	await check(container);
});

test("html textarea -- hydrated", async () => {
	let $state = $watch({
		text: "first",
		get output() {
			return "<h1>" + $state.text + "</h1>\n<p>End of " + $state.text + "</p>";
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	await check(container);
});

async function check(container: HTMLElement) {
	const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
	expect(textarea).not.toBeNull();
	expect(textarea.value).toBe("first");
	expect(container.querySelectorAll("h1")).toHaveLength(1);
	expect(queryByText(container, "first")).not.toBeNull();

	// First keystroke: the @html region should replace its content, not
	// duplicate it
	await userEvent.type(textarea, "2");

	expect(textarea.value).toBe("first2");
	expect(container.querySelectorAll("h1")).toHaveLength(1);
	expect(container.textContent).toContain("first2");
	expect(container.textContent).not.toContain("End of first\n");

	// Subsequent keystrokes keep updating the one and only region
	await userEvent.type(textarea, "3");

	expect(textarea.value).toBe("first23");
	expect(container.querySelectorAll("h1")).toHaveLength(1);
	expect(container.textContent).toContain("first23");
}
