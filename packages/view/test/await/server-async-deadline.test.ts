import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";

// Each boundary's fetch takes 80ms, inside its 150ms timeout. The child's
// boundary only starts once the parent's resolves, so measured from each
// boundary the child would make it too -- but the timeout counts from the
// start of the server render, so the child gives up rather than stacking
// another wait onto the response
const source = `
function Child() {
	let $state = $watch({
		get data() {
			return $async(() => delay("child data", 80), { source: "server", timeout: 150 });
		},
	});

	@render {
		@await {
			<p>Child: {$state.data}</p>
		} with {
			<p>Child loading...</p>
		}
	}
}

export default function Parent() {
	let $state = $watch({
		get data() {
			return $async(() => delay("parent data", 80), { source: "server", timeout: 150 });
		},
	});

	@render {
		@await {
			<p>Parent: {$state.data}</p>
			<Child />
		} with {
			<p>Parent loading...</p>
		}
	}
}

function delay(value: string, ms: number): Promise<string> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
`;

test("nested boundaries share one time limit, counted from the start of the render", async () => {
	const server = await importComponent(import.meta.filename, source, "server");

	const started = performance.now();
	const { body } = await server(undefined);
	const elapsed = performance.now() - started;

	expect(body).toContain("Parent: parent data");
	expect(body).toContain("Child loading...");
	expect(body).not.toContain("child data");
	// Bounded by the timeout, not the sum of the nested waits
	expect(elapsed).toBeLessThan(220);
});

test("a render's time limit doesn't carry over to the next render", async () => {
	const server = await importComponent(import.meta.filename, source, "server");
	const context = {};

	await server(undefined, context);
	const { body } = await server(undefined, context);

	expect(body).toContain("Parent: parent data");
});
