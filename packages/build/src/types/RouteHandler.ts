import type RouteLayoutHandler from "./RouteLayoutHandler";

type RouteHandler = {
	path: string;
	regex: RegExp;
	endPoint: Promise<any>;

	loaded: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: Promise<any>;
	serverHook?: Promise<any>;
};
export default RouteHandler;
