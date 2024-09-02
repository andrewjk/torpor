import type ServerComponentRender from "./ServerComponentRender";

/**
 * A component that can be mounted or hydrated
 */
export default interface ServerComponent {
	name: string;
	render: ServerComponentRender;
}
