import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	show: boolean;
	status: string;
}

const source = `
export default function IfInSwitch($props: { show: boolean; status: string }) {
	@render {
		@switch ($props.status) {
			case "active": {
				@if ($props.show) {
					<p>Active and visible</p>
				} else {
					<p>Active but hidden</p>
				}
			}
			case "inactive": {
				<p>Inactive</p>
			}
			default: {
				<p>Unknown status</p>
			}
		}
	}
}
`;

test("if in switch -- mounted", async () => {
	let $state = $watch({ show: true, status: "active" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if in switch -- hydrated", async () => {
	let $state = $watch({ show: true, status: "active" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Active and visible")).not.toBeNull();
	expect(queryByText(container, "Active but hidden")).toBeNull();

	state.show = false;
	expect(queryByText(container, "Active and visible")).toBeNull();
	expect(queryByText(container, "Active but hidden")).not.toBeNull();

	state.status = "inactive";
	expect(queryByText(container, "Active and visible")).toBeNull();
	expect(queryByText(container, "Active but hidden")).toBeNull();
	expect(queryByText(container, "Inactive")).not.toBeNull();

	state.status = "active";
	state.show = true;
	expect(queryByText(container, "Active and visible")).not.toBeNull();

	state.status = "unknown";
	expect(queryByText(container, "Unknown status")).not.toBeNull();
}
