import type RouteLayoutHandler from "./RouteLayoutHandler";

type RouteHandler = {
	path: string;
	endPoint: () => Promise<any>;

	loaded?: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: () => Promise<any>;
	serverHook?: () => Promise<any>;
};

export default RouteHandler;
