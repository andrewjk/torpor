// Declares `.torp?client` files as ES modules for TypeScript, so that
// `import Component from "./Counter.torp?client"` (the unplugin's per-import
// override for compiling a component for the client in a test project) gets
// the right type.
declare module "*.torp?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Component: ComponentType;
	export default Component;
}

// Components imported from packages that ship .torp files, with the ?client
// override
declare module "torp-lib/Widget?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Widget: ComponentType;
	export { Widget };
}

declare module "torp-lib/Solo?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Solo: ComponentType;
	export default Solo;
}

declare module "@torpor/ui/Progress?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Progress: ComponentType;
	export { Progress };
}

declare module "./components/PackageHost.torp?client" {
	import { Component as ComponentType } from "@torpor/view";
	const Component: ComponentType;
	export default Component;
}
