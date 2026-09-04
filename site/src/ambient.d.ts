// Declares `.torp` files (plus asset imports) as ES modules for TypeScript,
// so that `import Component from "./App.torp"` gets the right type.
//
// This file must exist in every app: ambient module declarations are only
// picked up from a global script-context .d.ts (one without top-level
// imports/exports), and the .d.mts files published with @torpor/view are
// modules. So the declaration can't ship from @torpor/view itself. Same
// pattern as Vite's vite-env.d.ts.
declare module "*.torp" {
	import { Component as ComponentType } from "@torpor/view";
	const Component: ComponentType;
	export default Component;
}

declare module "*.svg" {
	const content: string;
	export default content;
}
