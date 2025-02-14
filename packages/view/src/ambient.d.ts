/*
declare module "*.torp" {
	// HACK:
	//import { Component } from "./types/Component";
	type Component = (
		$parent: ParentNode,
		$anchor: Node | null,
		$props?: Record<PropertyKey, any>,
		$context?: Record<PropertyKey, any>,
		$slots?: Record<
			string,
			(
				parent: ParentNode,
				anchor: Node | null,
				$props?: Record<PropertyKey, any>,
				$context?: Record<PropertyKey, any>,
			) => void
		>,
	) => void;
	export const C: Component;
	//export default C;
}
*/
