import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	status: string;
}

const source = `
export default function SwitchString($props: { status: string }) {
	@render {
		@switch ($props.status) {
			case "loading": {
				<p>Loading...</p>
			}
			case "success": {
				<p>Loaded!</p>
			}
			case "error": {
				<p>Error occurred</p>
			}
			default: {
				<p>Idle</p>
			}
		}
	}
}
`;

test("switch string -- mounted", async () => {
	let $state = $watch({ status: "loading" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch string -- hydrated", async () => {
	let $state = $watch({ status: "loading" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Loading...")).not.toBeNull();
	expect(queryByText(container, "Loaded!")).toBeNull();
	expect(queryByText(container, "Error occurred")).toBeNull();
	expect(queryByText(container, "Idle")).toBeNull();

	state.status = "success";
	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Loaded!")).not.toBeNull();

	state.status = "error";
	expect(queryByText(container, "Loaded!")).toBeNull();
	expect(queryByText(container, "Error occurred")).not.toBeNull();

	state.status = "unknown";
	expect(queryByText(container, "Idle")).not.toBeNull();
	expect(queryByText(container, "Error occurred")).toBeNull();

	state.status = "loading";
	expect(queryByText(container, "Loading...")).not.toBeNull();
}
