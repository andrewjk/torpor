import type Component from "../types/Component";

/**
 * Whether a component function was compiled for SSR
 *
 * Server components are emitted as `async function`s taking
 * `(props, context, slots)` and returning a `{ body, head }` pair, while
 * client components are plain functions taking
 * `(parent, anchor, props, context, slots)`. Checking the function's
 * constructor distinguishes the two without calling it (which would start
 * the render). The name lives on the intrinsic `AsyncFunction` object, so
 * it survives minification.
 */
export default function isServerComponent(component: Component): boolean {
	return component.constructor?.name === "AsyncFunction";
}
