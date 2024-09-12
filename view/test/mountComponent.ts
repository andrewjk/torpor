import mount from "../src/mount";
import type Component from "../src/types/Component";

export default function mountComponent(container: HTMLElement, component: Component, state?: any) {
	document.body.appendChild(container);
	mount(container, component, state);
}
