type RouteLayoutHandler = {
	path: string;
	endPoint: Promise<any>;
	serverEndPoint?: Promise<any>;
};
export default RouteLayoutHandler;
