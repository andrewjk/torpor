import Component from "./Component";

interface HandlerRequest {
	routeParams?: Record<PropertyKey, string>;
	urlParams?: Record<PropertyKey, string>;
}

export default interface RouteHandler {
	data?: (request: HandlerRequest) => any;
	view?: (request: HandlerRequest) => Component;
}
