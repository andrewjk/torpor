import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

afterEach(() => {
	document.body.innerHTML = "";
});

const source = `
export default function TextValues($props: { str: string; num: number; bool: boolean; nullVal: null; undefVal: undefined; zero: number; negNum: number; nan: number }) {
	@render {
		<p id="str">{$props.str}</p>
		<p id="num">{$props.num}</p>
		<p id="bool">{$props.bool}</p>
		<p id="null">{$props.nullVal}</p>
		<p id="undef">{$props.undefVal}</p>
		<p id="zero">{$props.zero}</p>
		<p id="neg">{$props.negNum}</p>
		<p id="nan">{$props.nan}</p>
	}
}
`;

test("text renders various types correctly -- mounted", async () => {
	let $state = $watch({
		str: "hello",
		num: 42,
		bool: true,
		nullVal: null,
		undefVal: undefined,
		zero: 0,
		negNum: -5,
		nan: NaN,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(container.querySelector("#str")).toHaveTextContent("hello");
	expect(container.querySelector("#num")).toHaveTextContent("42");
	expect(container.querySelector("#bool")).toHaveTextContent("true");
	// null and undefined should render as empty string
	expect(container.querySelector("#null")).toHaveTextContent("");
	expect(container.querySelector("#undef")).toHaveTextContent("");
	// 0 should render as "0" (not empty)
	expect(container.querySelector("#zero")).toHaveTextContent("0");
	expect(container.querySelector("#neg")).toHaveTextContent("-5");
	expect(container.querySelector("#nan")).toHaveTextContent("NaN");

	// Update values
	$state.str = "world";
	$state.num = 100;
	$state.bool = false;
	$state.zero = 1;

	expect(container.querySelector("#str")).toHaveTextContent("world");
	expect(container.querySelector("#num")).toHaveTextContent("100");
	expect(container.querySelector("#bool")).toHaveTextContent("false");
	expect(container.querySelector("#zero")).toHaveTextContent("1");
});

test("text renders various types correctly -- hydrated", async () => {
	let $state = $watch({
		str: "hello",
		num: 42,
		bool: true,
		nullVal: null,
		undefVal: undefined,
		zero: 0,
		negNum: -5,
		nan: NaN,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(container.querySelector("#str")).toHaveTextContent("hello");
	expect(container.querySelector("#zero")).toHaveTextContent("0");
	expect(container.querySelector("#bool")).toHaveTextContent("true");
});
