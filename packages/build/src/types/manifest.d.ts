declare const manifest: {
	routes: { path: string; file: string; endPoint: () => Promise<any> }[];
};

export default manifest;
