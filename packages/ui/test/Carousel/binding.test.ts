import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import CarouselBindingTest from "./components/CarouselBindingTest.torp";

describe("Carousel (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CarouselBindingTest, {});

		expect(within(container).getByText("0")).toBeInTheDocument();

		fireEvent.click(within(container).getByRole("button", { name: "Next slide" }));

		expect(within(container).getByText("1")).toBeInTheDocument();
	});
});
