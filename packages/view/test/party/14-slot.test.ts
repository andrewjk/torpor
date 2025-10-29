import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function FunnyButtonApp() {
	@render {
		<FunnyButton />
		<FunnyButton>Click me!</FunnyButton>
	}
}

function FunnyButton() {
	@render {
		<button
			style="
				background: rgba(0, 0, 0, 0.4);
				color: #fff;
				padding: 10px 20px;
				font-size: 30px;
				border: 2px solid #fff;
				margin: 8px; transform: scale(0.9);
				box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
				transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
				outline: 0;
			"
		>
			<slot>
				<span>No content found</span>
			</slot>
		</button>
	}
}
`;

test("slot -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("slot -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Click me!")).not.toBeNull();
}
