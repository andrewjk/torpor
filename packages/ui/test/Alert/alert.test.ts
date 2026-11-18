import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import AlertTest from "./components/AlertTest.torp";

describe("Alert", () => {
	it("is an inline alert with a variant", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AlertTest as any, { variant: "error" });

		const alert = within(container).getByRole("alert");
		expect(alert).toHaveTextContent("Something went wrong.");
		expect(alert).toHaveAttribute("data-variant", "error");
	});
});
