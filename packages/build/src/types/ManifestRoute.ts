export default interface ManifestRoute {
	path: string;
	type: number;
	endPoint: () => Promise<any>;
}
