import RouteLayoutHandler from "./RouteLayoutHandler";

export default interface RouteHandler {
	path: string;
	regex: RegExp;
	endPoint: Promise<any>;

	loaded: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: Promise<any>;
	serverHook?: Promise<any>;
}
