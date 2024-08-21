import type Component from "../src/compile/types/Component";
import mount from "../src/render/mount";

export default function mountComponent(container: HTMLElement, component: Component, state?: any) {
  document.body.appendChild(container);
  mount(container, component, state);
}
