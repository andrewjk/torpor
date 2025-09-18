import type RouteLayoutHandler from "./RouteLayoutHandler";

export default interface RouteHandler {
	path: string;
	type: number;
	endPoint: () => Promise<any>;

	loaded?: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: () => Promise<any>;
	serverHook?: () => Promise<any>;
}
