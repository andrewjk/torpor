import hydrate from "../src/render/hydrate";
import type Component from "../src/types/Component";
import type ServerComponent from "../src/types/ServerComponent";

export default async function hydrateComponent(
	container: HTMLElement,
	clientComponent: Component,
	serverComponent: ServerComponent,
	state?: any,
): Promise<void> {
	// Server components are async (they may contain a `source: "server"`
	// `@await` boundary), so await the body/head pair
	const { body } = await serverComponent(state);
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);

	hydrate(container, clientComponent, state);
}
