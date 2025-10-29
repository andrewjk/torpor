import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function UserProfileContextApp() {
	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to unwrap this and pass in an update function?
	$context.user = $user;

	@render {
		<h1>Welcome back, {$user.username}</h1>
		<UserProfileContext />
	}
}

function UserProfileContext() {
	$context.user = $watch($context.user);

	@render {
		<h2>My Profile</h2>
		<p>Username: {$context.user.username}</p>
		<p>Email: {$context.user.email}</p>
		<button onclick={() => ($context.user.username = "Jane")}>
			Update username to Jane
		</button>
	}
}
`;

test("context -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("context -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const button = container.getElementsByTagName("button")[0];

	expect(queryByText(container, "Welcome back, unicorn42")).not.toBeNull();
	expect(queryByText(container, "Username: unicorn42")).not.toBeNull();

	await userEvent.click(button);

	expect(queryByText(container, "Welcome back, Jane")).not.toBeNull();
	expect(queryByText(container, "Username: Jane")).not.toBeNull();
}
