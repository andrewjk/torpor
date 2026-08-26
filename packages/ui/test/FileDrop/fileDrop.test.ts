import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import FileDropTest from "./components/FileDropTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onfiles = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, FileDropTest, { ...props, onfiles });
	return {
		container,
		onfiles,
		dropzone: () => within(container).getByRole("button", { name: "Upload files" }),
		input: () => container.querySelector('input[type="file"]') as HTMLInputElement,
	};
}

function makeFiles(names: string[]): any {
	return names.map((name) => new File(["content"], name, { type: "text/plain" }));
}

describe("FileDrop", () => {
	it("is a labelled button", async () => {
		const { dropzone } = setup();

		expect(dropzone()).toBeInTheDocument();
		expect(dropzone()).toHaveAttribute("tabindex", "0");
	});

	it("shows fallback content when empty", async () => {
		const { container } = setup();

		expect(container.querySelector(".torp-file-drop-text")).toHaveTextContent(
			"Drag and drop files here",
		);
	});

	it("opens the file dialog on click", async () => {
		const { input } = setup();
		const spy = vi.spyOn(input(), "click");

		fireEvent.click(input().previousElementSibling!);

		expect(spy).toHaveBeenCalled();
	});

	it("opens the file dialog with Enter and Space", async () => {
		const { dropzone, input } = setup();
		const spy = vi.spyOn(input(), "click");

		fireEvent.keyDown(dropzone(), { key: "Enter" });
		expect(spy).toHaveBeenCalledTimes(1);

		fireEvent.keyDown(dropzone(), { key: " " });
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("raises onfiles with dropped files", async () => {
		const { dropzone, onfiles } = setup({ multiple: true });

		fireEvent.drop(dropzone(), { dataTransfer: { files: makeFiles(["a.txt", "b.txt"]) } });

		expect(onfiles).toHaveBeenCalledTimes(1);
		const files = onfiles.mock.calls[0][0];
		expect(files.map((f: File) => f.name)).toEqual(["a.txt", "b.txt"]);
	});

	it("only takes the first file without multiple", async () => {
		const { dropzone, onfiles } = setup();

		fireEvent.drop(dropzone(), { dataTransfer: { files: makeFiles(["a.txt", "b.txt"]) } });

		const files = onfiles.mock.calls[0][0];
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe("a.txt");
	});

	it("marks itself while dragging over", async () => {
		const { dropzone } = setup();

		fireEvent.dragOver(dropzone(), { dataTransfer: {} });
		expect(dropzone()).toHaveAttribute("data-state", "over");

		fireEvent.dragLeave(dropzone());
		expect(dropzone()).not.toHaveAttribute("data-state");
	});

	it("raises onfiles for files picked with the dialog", async () => {
		const { input, onfiles } = setup();

		Object.defineProperty(input(), "files", {
			value: makeFiles(["picked.txt"]),
		});
		fireEvent.change(input());

		expect(onfiles).toHaveBeenCalledWith([expect.objectContaining({ name: "picked.txt" })]);
	});

	it("forwards accept and name to the input", async () => {
		const { input } = setup({ accept: "image/*", name: "upload" });

		expect(input()).toHaveAttribute("accept", "image/*");
		expect(input()).toHaveAttribute("name", "upload");
	});

	it("does nothing when disabled", async () => {
		const { dropzone, input, onfiles } = setup({ disabled: true });
		const spy = vi.spyOn(input(), "click");

		fireEvent.click(dropzone());
		fireEvent.keyDown(dropzone(), { key: "Enter" });
		fireEvent.drop(dropzone(), { dataTransfer: { files: makeFiles(["a.txt"]) } });

		expect(spy).not.toHaveBeenCalled();
		expect(onfiles).not.toHaveBeenCalled();
		expect(dropzone()).toHaveAttribute("aria-disabled", "true");
	});
});
