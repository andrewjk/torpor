import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const selectSource = `
export default function SelectValue($props: { value: string }) {
	@render {
		<select value={$props.value}>
			<option value="a">Option A</option>
			<option value="b">Option B</option>
			<option value="c">Option C</option>
		</select>
	}
}
`;

test("select value sets initial value -- mounted", async () => {
	let $state = $watch({ value: "b" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, selectSource, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("b");
});

test("select value reacts to state change -- mounted", async () => {
	let $state = $watch({ value: "a" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, selectSource, "client");
	mountComponent(container, component, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("a");

	$state.value = "c";
	expect(select.value).toBe("c");
});

test("select value -- hydrated", async () => {
	let $state = $watch({ value: "b" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, selectSource, "client");
	const serverComponent = await importComponent(import.meta.filename, selectSource, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	let select = container.querySelector("select") as HTMLSelectElement;
	expect(select.value).toBe("b");
});

const inputSource = `
export default function InputValue($props: { value: string }) {
	@render {
		<input value={$props.value} />
	}
}
`;

test("input value sets and tracks value -- mounted", async () => {
	let $state = $watch({ value: "hello" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, inputSource, "client");
	mountComponent(container, component, $state);

	let input = container.querySelector("input") as HTMLInputElement;
	expect(input.value).toBe("hello");

	$state.value = "world";
	expect(input.value).toBe("world");
});

const textareaSource = `
export default function TextareaValue($props: { value: string }) {
	@render {
		<textarea value={$props.value}></textarea>
	}
}
`;

test("textarea value sets and tracks value -- mounted", async () => {
	let $state = $watch({ value: "hello" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, textareaSource, "client");
	mountComponent(container, component, $state);

	let textarea = container.querySelector("textarea") as HTMLTextAreaElement;
	expect(textarea.value).toBe("hello");

	$state.value = "world";
	expect(textarea.value).toBe("world");
});
