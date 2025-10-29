import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function TrafficLight() {
	const TRAFFIC_LIGHTS = ["red", "orange", "green"];
	let $state = $watch({
		lightIndex: 0,
		get light() {
			return TRAFFIC_LIGHTS[this.lightIndex];
		}
	});

	function nextLight() {
		$state.lightIndex = ($state.lightIndex + 1) % TRAFFIC_LIGHTS.length;
	}

	@render {
		<button onclick={nextLight}>Next light</button>
		<p>Light is: {$state.light}</p>
		<p>
			You must
			@if ($state.light === "red") {
				<span>STOP</span>
			} else if ($state.light === "orange") {
				<span>SLOW DOWN</span>
			} else if ($state.light === "green") {
				<span>GO</span>
			}
		</p>
	}
}
`;

test("conditional -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("conditional -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "STOP")).not.toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).not.toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	await userEvent.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).not.toBeNull();
}
