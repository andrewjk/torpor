type ManifestRoute = {
	path: string;
	type: number;
	endPoint: () => Promise<any>;
};

export default ManifestRoute;
