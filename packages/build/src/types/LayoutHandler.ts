type LayoutHandler = {
	path: string;
	endPoint: () => Promise<any>;
	serverEndPoint?: () => Promise<any>;
};

export default LayoutHandler;
