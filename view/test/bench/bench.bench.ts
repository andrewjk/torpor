import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, bench } from "vitest";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/bench/components/Bench";

const user = userEvent.setup();

beforeAll(async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);
});

bench("bench", async () => {
	const createButton = document.getElementById("create")!;
	const createLotsButton = document.getElementById("createlots")!;
	const appendButton = document.getElementById("append")!;
	const updateButton = document.getElementById("update")!;
	const swapButton = document.getElementById("swaprows")!;
	const clearButton = document.getElementById("clear")!;

	try {
		// Press a bunch of buttons
		await user.click(createButton);
		await user.click(appendButton);
		await user.click(updateButton);
		await user.click(swapButton);
		await user.click(clearButton);
	} catch {
		console.log("ERROR");
	}
});
