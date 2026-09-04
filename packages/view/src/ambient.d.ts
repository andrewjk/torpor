/* eslint-disable */
// Explores declaring `*.torp` here in @torpor/view, so that apps don't need
// their own ambient.d.ts. It doesn't work in the published build: the bundled
// dist/index.d.mts is a module (it has top-level exports), and ambient module
// declarations only register globally from a script-context file. Until TS
// has a mechanism for that, every app keeps a small ambient.d.ts -- see
// packages/create-build/template/src/ambient.d.ts.
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
