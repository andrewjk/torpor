import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
function Thrower() {
	function boom() {
		throw new Error("child boom");
	}

	@render {
		@if (boom()) {
			<p>This is never rendered</p>
		}
	}
}

export default function TryCatchPartial() {
	@render {
		@try {
			<p>First</p>
			<Thrower />
			<p>Third</p>
		} catch (err) {
			<p class="error">Caught: {err.message}</p>
		}
	}
}
`;

test("try catch -- partial content is cleared before the catch branch renders", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	// The first element was added to the DOM before the throw; it must not
	// leak into the rendered output next to the catch content
	expect(queryByText(container, "First")).toBeNull();
	expect(queryByText(container, "Third")).toBeNull();
	expect(queryByText(container, "Caught: child boom")).not.toBeNull();
});
