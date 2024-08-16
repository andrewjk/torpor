import type Component from "../src/compile/types/Component";
import render from "../src/render/render";

export default function mountComponent(container: HTMLElement, component: Component, state?: any) {
  document.body.appendChild(container);
  render(container, component, state);
}
