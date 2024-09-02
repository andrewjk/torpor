import type ComponentRender from "./ComponentRender";

/**
 * A component that can be mounted or hydrated
 */
export default interface Component {
	name: string;
	render: ComponentRender;
}
