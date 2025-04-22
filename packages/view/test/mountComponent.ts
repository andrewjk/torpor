import mount from "../src/render/mount";
import { type Component } from "../src/types/Component";

export default function mountComponent(
	container: HTMLElement,
	component: Component,
	state?: any,
): void {
	container.ownerDocument.body.appendChild(container);
	mount(container, component, state);
}
