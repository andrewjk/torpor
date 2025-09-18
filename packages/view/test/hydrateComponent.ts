import hydrate from "../src/render/hydrate";
import type Component from "../src/types/Component";
import type ServerComponent from "../src/types/ServerComponent";

export default function hydrateComponent(
	container: HTMLElement,
	clientComponent: Component,
	serverComponent: ServerComponent,
	state?: any,
): void {
	const { body } = serverComponent(state);
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);

	hydrate(container, clientComponent, state);
}
