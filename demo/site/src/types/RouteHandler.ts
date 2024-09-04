import Component from "./Component";

export default interface RouteHandler {
	data?: () => any;
	view?: () => Component;
}
