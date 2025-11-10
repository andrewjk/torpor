import { getByText, queryByText, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Await() {
	// Use the $watch function to declare reactive state
	let $state = $watch({
		guesser: Promise.resolve(0)
	});

	// This is an async function
	let attempt = 0
	$state.guesser = guessNumber(100)
	async function guessNumber(ms: number) {
		attempt++
		return new Promise<number>((ok, err) => {
			return setTimeout(
				attempt % 3 === 0
					? () => err("uh oh")
					: () => ok(Math.floor(Math.random() * 10 + 1)),
				ms)
		})
	}

	@render {
		@await ($state.guesser) {
			<p>Hmm...</p>
		} then (_number) {
			<p>Is it a number?</p>
		} catch (ex) {
			<p class="error">Something went wrong: {ex}!</p>
		}
		<button onclick={() => $state.guesser = guessNumber(100)}>
			Guess again
		</button>
	}
}
`;

test("await -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("await -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await userEvent.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await userEvent.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Hmm...")).toBeNull();
	expect(queryByText(container, "Something went wrong: uh oh!")).not.toBeNull();
}
