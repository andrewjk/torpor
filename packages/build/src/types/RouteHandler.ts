import { type RouteLayoutHandler } from "./RouteLayoutHandler";

export type RouteHandler = {
	path: string;
	regex: RegExp;
	endPoint: Promise<any>;

	loaded: boolean;
	layouts?: RouteLayoutHandler[];
	serverEndPoint?: Promise<any>;
	serverHook?: Promise<any>;
};
