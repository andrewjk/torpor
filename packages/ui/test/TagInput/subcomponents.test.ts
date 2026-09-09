import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import TagInputComposedTest from "./components/TagInputComposedTest.torp";
import TagInputTest from "./components/TagInputTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function createDeferredLoader() {
	const requests: any[] = [];
	const resolvers: ((result: any) => void)[] = [];
	return {
		requests,
		load: (request: any) =>
			new Promise<any>((resolve) => {
				requests.push(request);
				resolvers.push((result: any) => resolve(result ?? { items: [] }));
			}),
		resolveNext: (result?: any) => {
			resolvers.shift()!(result ?? { items: [] });
		},
	};
}

describe("TagInput (subcomponents)", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("renders tags and the field automatically with no children", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputTest, { value: ["alpha"] });

		const tag = container.querySelector(".torp-tag-input-tag")!;
		expect(tag).toHaveTextContent("alpha");
		expect(within(container).getByRole("button", { name: "Remove alpha" })).toBeInTheDocument();
		expect(container.querySelector(".torp-tag-input-field")).toBeInTheDocument();
	});

	it("renders explicitly composed tags with their own props", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputComposedTest, {
			value: ["alpha", "beta"],
			tagClass: "custom-tag",
			onchange,
		});

		const tags = container.querySelectorAll(".torp-tag-input-tag");
		expect(tags).toHaveLength(2);
		expect(tags[0]).toHaveClass("custom-tag");

		// Removing still works through the composed tag
		fireEvent.click(within(container).getByRole("button", { name: "Remove alpha" }));
		expect(onchange).toHaveBeenCalledWith(["beta"]);
	});

	it("adds tags through the composed field", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputComposedTest, { fieldClass: "custom-field", onchange });

		const field = container.querySelector(".torp-tag-input-field") as HTMLInputElement;
		expect(field).toHaveClass("custom-field");

		fireEvent.input(field, { target: { value: "new" } });
		fireEvent.keyDown(field, { key: "Enter" });

		expect(onchange).toHaveBeenCalledWith(["new"]);
		expect(container.querySelector(".torp-tag-input-tag")).toHaveTextContent("new");
	});

	it("shows composed suggestions from a loader and picks one", async () => {
		const loader = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputComposedTest, {
			load: loader.load,
			suggestionsClass: "custom-suggestions",
			onchange,
		});

		const field = within(container).getByRole("combobox") as HTMLInputElement;
		fireEvent.input(field, { target: { value: "ja" } });
		loader.resolveNext({ items: ["java", "javascript"] });
		await tick();

		const list = container.querySelector(".torp-tag-input-suggestions")!;
		expect(list).toHaveClass("custom-suggestions");
		const options = [...list.querySelectorAll('[role="option"]')];
		expect(options.map((o) => o.textContent?.trim())).toEqual(["java", "javascript"]);

		fireEvent.keyDown(field, { key: "ArrowDown" });
		await tick();
		fireEvent.keyDown(field, { key: "Enter" });
		await tick();

		expect(onchange).toHaveBeenCalledWith(["java"]);
		// The dropdown closed after selection
		expect(container.querySelector(".torp-tag-input-suggestions")).not.toBeInTheDocument();
	});
});
