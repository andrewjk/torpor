import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TagInputTest from "./components/TagInputTest.torp";

describe("TagInput (accessibility)", () => {
	it("has a labelled field and a list of tags", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputTest, { value: ["a", "b"] });

		expect(within(container).getByRole("textbox", { name: "Tags" })).toBeInTheDocument();
		expect(within(container).getAllByRole("listitem")).toHaveLength(2);
	});

	it("labels each remove button with its tag", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputTest, { value: ["alpha"] });

		expect(within(container).getByRole("button", { name: "Remove alpha" })).toBeInTheDocument();
	});
});
