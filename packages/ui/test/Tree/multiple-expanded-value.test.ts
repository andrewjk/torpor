import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import TreeSingle from "./components/TreeSingle.torp";

describe("Tree (multiple expand)", () => {
	it("Multiple expanded items default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeSingle, { expanded: ["item-1", "item-3"] });

		expect(queryByText(container, "Folder 1")).toBeInTheDocument();
		expect(queryByText(container, "Folder 2")).toBeInTheDocument();
		expect(queryByText(container, "File 3")).toBeInTheDocument();
	});
});
