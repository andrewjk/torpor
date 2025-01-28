export type RouteLayoutHandler = {
	path: string;
	endPoint: Promise<any>;
	serverEndPoint?: Promise<any>;
};
