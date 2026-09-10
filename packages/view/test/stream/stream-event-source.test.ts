import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

class FakeEventSource {
	static instances: FakeEventSource[] = [];

	url: string;
	onmessage: ((e: { data: string }) => void) | null = null;
	closed = false;

	constructor(url: string) {
		this.url = url;
		FakeEventSource.instances.push(this);
	}

	close() {
		this.closed = true;
	}
}

(globalThis as any).EventSource = FakeEventSource;

const source = `
export default function StreamEventSource() {
	let $state = $watch({
		id: 1,
		messages: [] as string[],
	});

	$stream(fromServer(() => \`/sse/\${$state.id}\`), (e) => {
		$state.messages.push(String(e.data));
	});

	@render {
		<button onclick={() => { $state.id++ }}>Bump</button>
		<ul>
			@for (let m of $state.messages) {
				<li>{m}</li>
			}
		</ul>
	}
}
`;

function clickBump(container: HTMLElement) {
	(container.getElementsByTagName("button")[0] as HTMLButtonElement).click();
}

test("stream -- server render never subscribes to the source", async () => {
	FakeEventSource.instances.length = 0;

	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent(undefined);

	expect(body).toContain("<button");
	expect(FakeEventSource.instances.length).toBe(0);
});

test("stream -- fromServer connects on mount and receives messages", async () => {
	FakeEventSource.instances.length = 0;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(FakeEventSource.instances.length).toBe(1);
	expect(FakeEventSource.instances[0].url).toBe("/sse/1");

	FakeEventSource.instances[0].onmessage!({ data: "hello" });
	expect(queryByText(container, "hello")).not.toBeNull();
});

test("stream -- fromServer reconnects when the url changes", async () => {
	FakeEventSource.instances.length = 0;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(FakeEventSource.instances.length).toBe(1);
	expect(FakeEventSource.instances[0].url).toBe("/sse/1");

	clickBump(container);

	expect(FakeEventSource.instances.length).toBe(2);
	expect(FakeEventSource.instances[0].closed).toBe(true);
	expect(FakeEventSource.instances[1].url).toBe("/sse/2");
});
