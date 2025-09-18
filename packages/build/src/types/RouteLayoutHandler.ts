export default interface RouteLayoutHandler {
	path: string;
	endPoint: () => Promise<any>;
	serverEndPoint?: () => Promise<any>;
}
