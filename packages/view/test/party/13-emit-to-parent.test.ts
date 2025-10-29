import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AnswerButtonApp() {
	let $state = $watch({
		isHappy: true
	});

	function onAnswerNo() {
		$state.isHappy = false;
	}

	function onAnswerYes() {
		$state.isHappy = true;
	}

	@render {
		<p>Are you happy?</p>
		<AnswerButton onYes={onAnswerYes} onNo={onAnswerNo} />
		<p style="font-size: 50px;">{$state.isHappy ? "😀" : "😥"}</p>
	}
}

function AnswerButton($props: any) {
	@render {
		<button onclick={$props.onYes}>YES</button>
		<button onclick={$props.onNo}>NO</button>
	}
}
`;

test("emit to parent -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("emit to parent -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const yesButton = container.getElementsByTagName("button")[0];
	const noButton = container.getElementsByTagName("button")[1];

	expect(queryByText(container, "😀")).not.toBeNull();
	expect(queryByText(container, "😥")).toBeNull();

	await userEvent.click(noButton);

	expect(queryByText(container, "😀")).toBeNull();
	expect(queryByText(container, "😥")).not.toBeNull();

	await userEvent.click(yesButton);

	expect(queryByText(container, "😀")).not.toBeNull();
	expect(queryByText(container, "😥")).toBeNull();
}
