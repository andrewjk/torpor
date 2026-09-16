import type MiddlewareFunction from "../server/types/MiddlewareFunction";
import type ManifestRoute from "./ManifestRoute";

declare const manifest: {
	base: string;
	viewTransitions?: boolean;
	middleware?: MiddlewareFunction[];
	routes: ManifestRoute[];
};

export default manifest;
