export default interface LayoutHandler {
	path: string;
	endPoint: () => Promise<any>;
	serverEndPoint?: () => Promise<any>;
}
