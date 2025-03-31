type ManifestRoute = {
	path: string;
	type: number;
	file: string;
	endPoint: () => Promise<any>;
};

export default ManifestRoute;
