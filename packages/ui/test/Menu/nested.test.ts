import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import MenuNested from "./components/MenuNested.torp";

describe("Nested submenus", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("opens nested submenu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuNested);

		await userEvent.click(getByText(container, "Level 1 popout"));
		expect(queryByText(container, "Level 2 item 1")).toBeInTheDocument();

		await userEvent.click(getByText(container, "Level 2 popout"));
		expect(queryByText(container, "Level 3 item 1")).toBeInTheDocument();
	});

	it("closes parent when closing nested submenu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuNested);

		await userEvent.click(getByText(container, "Level 1 popout"));
		expect(queryByText(container, "Level 2 item 1")).toBeInTheDocument();

		await userEvent.click(getByText(container, "Level 2 popout"));
		expect(queryByText(container, "Level 3 item 1")).toBeInTheDocument();

		await userEvent.keyboard("{Escape}");
		expect(queryByText(container, "Level 3 item 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Level 2 item 1")).toBeInTheDocument();

		await userEvent.keyboard("{Escape}");
		expect(queryByText(container, "Level 2 item 1")).not.toBeInTheDocument();
	});

	it("focus management works across multiple levels", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuNested);

		await userEvent.click(getByText(container, "Level 1 popout"));
		expect(getByText(container, "Level 2 item 1")).toHaveFocus();

		await userEvent.keyboard("{ArrowDown}");
		expect(getByText(container, "Level 2 item 2")).toHaveFocus();
	});

	it("keyboard navigation works in nested menu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuNested);

		await userEvent.click(getByText(container, "Level 1 popout"));
		await userEvent.click(getByText(container, "Level 2 popout"));

		await userEvent.keyboard("{ArrowDown}");
		expect(getByText(container, "Level 3 item 2")).toHaveFocus();

		await userEvent.keyboard("{ArrowUp}");
		expect(getByText(container, "Level 3 item 1")).toHaveFocus();
	});
});
