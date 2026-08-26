import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import FileDropFormTest from "./components/FileDropFormTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, FileDropFormTest, props);
	return {
		container,
		form: () => container.querySelector("#test-form") as HTMLFormElement,
		input: () => container.querySelector('input[type="file"]') as HTMLInputElement,
	};
}

function makeFiles(names: string[]): any {
	return names.map((name) => new File(["content"], name, { type: "text/plain" }));
}

describe("FileDrop (in forms)", () => {
	it("sets the form's enctype to multipart", async () => {
		const { form } = setup();

		expect(form()).toHaveAttribute("enctype", "multipart/form-data");
	});

	it("names its hidden input for submission", async () => {
		const { input } = setup();

		expect(input()).toHaveAttribute("name", "attachments");
	});

	it("keeps dialog-selected files in the form data", async () => {
		const { input, form } = setup();

		Object.defineProperty(input(), "files", {
			value: makeFiles(["picked.txt"]),
		});
		fireEvent.change(input());

		expect(input().form).toBe(form());
		expect(new FormData(form()).get("attachments")).toBeTruthy();
	});
});
