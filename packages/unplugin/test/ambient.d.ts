// Declares `.torp?client` files as ES modules for TypeScript, so that
// `import Component from "./Counter.torp?client"` (the unplugin's per-import
// override for compiling a component for the client in a test project) gets
// the right type.
declare module "*.torp?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Component: ComponentType;
	export default Component;
}
